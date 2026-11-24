import { Injectable } from '@nestjs/common';

import { fieldError } from '../../common/app-error';
import { Tx } from '../../common/transaction/transaction.service';
import { MembershipRequest } from '../../database/entities';
import { TurnstileService } from '../../infrastructure/turnstile/turnstile.service';
import { AuditService } from '../audit/audit.service';
import { MembersService } from '../members/members.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { fullName } from '../users/user.mapper';
import type { MembershipApplicationDto } from './memberships.schemas';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly tx: Tx,
    private readonly turnstile: TurnstileService,
    private readonly members: MembersService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Public form: anti-robot check, PENDING request, acknowledgement e-mail queued;
   * approved at once when automatic approval is on.
   */
  async submit(dto: MembershipApplicationDto, ip?: string) {
    await this.turnstile.verify(dto.turnstileToken, ip);
    if (await this.members.emailIsMember(dto.email)) {
      throw fieldError(409, 'ALREADY_MEMBER', 'email', 'Cette adresse est déjà celle d’un membre. Connectez-vous à votre espace.');
    }
    const { turnstileToken: _token, ...data } = dto;
    const repo = this.tx.repo(MembershipRequest);
    const request = await repo.save(repo.create(data));
    await this.audit.record({
      action: 'MEMBERSHIP_SUBMITTED',
      entityType: 'MembershipRequest',
      entityId: request.id,
      entityLabel: fullName(request),
      after: { status: 'PENDING' },
    });
    await this.notifications.schedule('MEMBERSHIP_RECEIVED', request.email, { firstName: request.firstName }, `membership-received:${request.id}`);

    if ((await this.settings.membership()).autoApprove) {
      const approved = await this.approve(request.id, { automatic: true });
      return { id: approved.id, status: approved.status };
    }
    return { id: request.id, status: request.status };
  }

  /** Creates the member and decides the request in the current transaction. */
  async approve(id: string, by: { automatic: true } | { userId: string }): Promise<MembershipRequest> {
    const request = await this.tx.repo(MembershipRequest).findOneByOrFail({ id });
    const member = await this.members.createFromRequest(request);
    await this.tx.repo(MembershipRequest).update(id, {
      status: 'APPROVED',
      decidedAt: new Date(),
      decidedById: 'userId' in by ? by.userId : null,
      decidedAutomatically: 'automatic' in by,
      memberId: member.id,
    });
    await this.audit.record({
      action: 'MEMBERSHIP_APPROVED',
      entityType: 'MembershipRequest',
      entityId: id,
      entityLabel: fullName(request),
      before: { status: 'PENDING' },
      after: { status: 'APPROVED', memberId: member.id, ...('automatic' in by ? { automatic: true } : {}) },
    });
    await this.notifications.schedule(
      'MEMBERSHIP_APPROVED',
      member.email,
      { firstName: member.firstName, memberNumber: member.memberNumber },
      `membership-approved:${id}`,
    );
    return this.tx.repo(MembershipRequest).findOneByOrFail({ id });
  }
}
