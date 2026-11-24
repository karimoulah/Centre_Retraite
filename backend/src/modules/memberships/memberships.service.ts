import { Injectable } from '@nestjs/common';

import { AppError, fieldError, notFound } from '../../common/app-error';
import { paginate } from '../../common/pagination';
import { Tx } from '../../common/transaction/transaction.service';
import { AuditLog, type Member, MembershipRequest, User, UserRole } from '../../database/entities';
import { TurnstileService } from '../../infrastructure/turnstile/turnstile.service';
import { PasswordService } from '../auth/password.service';
import { AuditService } from '../audit/audit.service';
import { MembersService } from '../members/members.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { fullName } from '../users/user.mapper';
import { toMembershipRequest } from './membership.mapper';
import type { DecisionDto, ListMembershipsQuery, MembershipApplicationDto, RejectDto } from './memberships.schemas';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly tx: Tx,
    private readonly turnstile: TurnstileService,
    private readonly members: MembersService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly passwords: PasswordService,
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

  /**
   * Creates the member (and by default a MEMBER account with a 72-hour invitation link),
   * decides the request and queues the welcome e-mail, all in the current transaction.
   */
  async approve(id: string, by: { automatic: true } | { userId: string }, options: DecisionDto = { createAccount: true }) {
    const request = await this.pending(id);
    const member = await this.members.createFromRequest(request);
    const accountUrl = options.createAccount ? await this.openAccount(member) : null;
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
      { firstName: member.firstName, memberNumber: member.memberNumber, accountUrl },
      `membership-approved:${id}`,
    );
    return this.view(id);
  }

  /** Refusal with a reason (5 characters or more); no e-mail is sent. */
  async reject(id: string, dto: RejectDto, userId: string) {
    const request = await this.pending(id);
    await this.tx.repo(MembershipRequest).update(id, {
      status: 'REJECTED',
      decidedAt: new Date(),
      decidedById: userId,
      rejectionReason: dto.reason,
    });
    await this.audit.record({
      action: 'MEMBERSHIP_REJECTED',
      entityType: 'MembershipRequest',
      entityId: id,
      entityLabel: fullName(request),
      before: { status: 'PENDING' },
      after: { status: 'REJECTED', reason: dto.reason },
    });
    return this.view(id);
  }

  /** Locks the row so two administrators cannot decide the same request at once. */
  private async pending(id: string): Promise<MembershipRequest> {
    const request = await this.tx
      .repo(MembershipRequest)
      .createQueryBuilder('r')
      .setLock('pessimistic_write')
      .where('r.id = :id', { id })
      .getOne();
    if (!request) throw notFound('Demande introuvable.');
    if (request.status !== 'PENDING') {
      const decided = await this.view(id);
      const verb = request.status === 'APPROVED' ? 'approuvée' : 'refusée';
      throw new AppError(409, 'ALREADY_DECIDED', `Cette demande a déjà été traitée (${verb}${decided.decidedBy ? ` par ${decided.decidedBy}` : ''}).`);
    }
    return request;
  }

  /** MEMBER account linked to the member. An existing staff account with the same e-mail gets the role instead. */
  private async openAccount(member: Member): Promise<string | null> {
    const users = this.tx.repo(User);
    const existing = await users.createQueryBuilder('u').where('lower(u.email) = lower(:email)', { email: member.email }).getOne();
    if (existing) {
      await users.update(existing.id, { memberId: member.id });
      await this.tx.repo(UserRole).upsert({ userId: existing.id, role: 'MEMBER' }, ['userId', 'role']);
      return null;
    }
    const saved = await users.save(
      users.create({ email: member.email, firstName: member.firstName, lastName: member.lastName, memberId: member.id, userRoles: [{ role: 'MEMBER' }] }),
    );
    const user = await users.findOneByOrFail({ id: saved.id });
    await this.audit.record({ action: 'USER_CREATED', entityType: 'User', entityId: user.id, entityLabel: fullName(user), after: { email: user.email, roles: user.roles, memberId: member.id } });
    return (await this.passwords.createLink(user, 'INVITATION')).url;
  }

  private async view(id: string) {
    return toMembershipRequest(await this.tx.repo(MembershipRequest).findOneOrFail({ where: { id }, relations: { decidedBy: true } }));
  }

  /** Back-office list: filter by status, search by name or e-mail, newest first by default. */
  list(query: ListMembershipsQuery) {
    const qb = this.tx.repo(MembershipRequest).createQueryBuilder('r').leftJoinAndSelect('r.decidedBy', 'd');
    if (query.status) qb.andWhere('r.status = :status', { status: query.status });
    return paginate(
      qb,
      query,
      {
        sortable: { submittedAt: 'r.submittedAt', name: 'r.lastName', email: 'r.email', status: 'r.status', decidedAt: 'r.decidedAt' },
        defaultSort: { key: 'submittedAt', order: 'desc' },
        search: ['r.email', 'r.firstName', 'r.lastName'],
      },
      toMembershipRequest,
    );
  }

  /** One request with its history (submission, decision) read from the audit log. */
  async get(id: string) {
    const request = await this.tx.repo(MembershipRequest).findOne({ where: { id }, relations: { decidedBy: true } });
    if (!request) throw notFound('Demande introuvable.');
    const history = await this.tx
      .repo(AuditLog)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.actor', 'actor')
      .where('a.entity_type = :type AND a.entity_id = :id', { type: 'MembershipRequest', id })
      .orderBy('a.at', 'ASC')
      .addOrderBy('a.id', 'ASC')
      .getMany();
    return {
      ...toMembershipRequest(request),
      history: history.map((h) => ({
        at: h.at.toISOString(),
        action: h.action,
        actor: h.actor ? { id: h.actor.id, name: fullName(h.actor) } : null,
        after: h.after,
      })),
    };
  }
}
