import { Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

import { AppError } from '../../common/app-error';
import { Tx } from '../../common/transaction/transaction.service';
import { Consent, Member, type User } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { fullName } from '../users/user.mapper';
import { CONSENT_KEYS, type ConsentKey, toConsents, toMember } from './member.mapper';
import type { UpdateConsentsDto, UpdateMyProfileDto } from './members.schemas';
import { MembersService } from './members.service';

@Injectable()
export class MeService {
  constructor(
    private readonly tx: Tx,
    private readonly members: MembersService,
    private readonly audit: AuditService,
  ) {}

  async profile(user: User) {
    return toMember(await this.mine(user));
  }

  async updateProfile(user: User, dto: UpdateMyProfileDto) {
    const member = await this.mine(user);
    const before = { phone: member.phone, address: member.address };
    await this.tx.repo(Member).update(member.id, dto);
    const updated = await this.mine(user);
    await this.audit.record({
      action: 'PROFILE_UPDATED',
      entityType: 'Member',
      entityId: member.id,
      entityLabel: fullName(member),
      before,
      after: { phone: updated.phone, address: updated.address },
    });
    return toMember(updated);
  }

  async consents(user: User) {
    return toConsents((await this.mine(user)).consents);
  }

  /** Each change is a dated row: granting opens one, withdrawing closes the active one. Nothing is erased. */
  async updateConsents(user: User, dto: UpdateConsentsDto) {
    const member = await this.mine(user);
    const current = toConsents(member.consents);
    const changed = (Object.entries(dto) as [ConsentKey, boolean][]).filter(([key, granted]) => current[key].granted !== granted);
    const repo = this.tx.repo(Consent);
    for (const [key, granted] of changed) {
      const type = CONSENT_KEYS[key];
      if (granted) await repo.insert({ memberId: member.id, type, grantedAt: new Date() });
      else await repo.update({ memberId: member.id, type, withdrawnAt: IsNull() }, { withdrawnAt: new Date() });
    }
    if (changed.length) {
      await this.audit.record({
        action: 'CONSENTS_UPDATED',
        entityType: 'Member',
        entityId: member.id,
        entityLabel: fullName(member),
        before: Object.fromEntries(changed.map(([key]) => [key, current[key].granted])),
        after: Object.fromEntries(changed),
      });
    }
    return toConsents((await this.mine(user)).consents);
  }

  private async mine(user: User): Promise<Member> {
    if (!user.memberId) throw new AppError(404, 'NOT_A_MEMBER', 'Aucune fiche de membre pour ce compte.');
    return this.members.find(user.memberId);
  }
}
