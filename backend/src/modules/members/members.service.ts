import { Injectable } from '@nestjs/common';

import { conflict, notFound } from '../../common/app-error';
import { paginate } from '../../common/pagination';
import { Tx } from '../../common/transaction/transaction.service';
import { Consent, type ConsentType, Member, type MembershipRequest, Session, User } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { fullName } from '../users/user.mapper';
import { toMember } from './member.mapper';
import type { ListMembersQuery, UpdateMemberDto } from './members.schemas';

@Injectable()
export class MembersService {
  constructor(
    private readonly tx: Tx,
    private readonly audit: AuditService,
  ) {}

  /** Creates the member of an approved request, with the consents given in the form. */
  async createFromRequest(request: MembershipRequest): Promise<Member> {
    const repo = this.tx.repo(Member);
    const saved = await repo.save(
      repo.create({
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
        address: request.address,
        sex: request.sex,
        ageCategory: request.ageCategory,
        birthDate: request.birthDate,
      }),
    );
    const granted: ConsentType[] = [
      ...(request.birthdayWishesConsent ? (['BIRTHDAY_WISHES'] as const) : []),
      ...(request.newsletterConsent ? (['NEWSLETTER'] as const) : []),
    ];
    if (granted.length) {
      await this.tx.repo(Consent).insert(granted.map((type) => ({ memberId: saved.id, type, grantedAt: new Date() })));
    }
    return this.find(saved.id);
  }

  list(query: ListMembersQuery) {
    const qb = this.tx.repo(Member).createQueryBuilder('m').leftJoinAndSelect('m.consents', 'c').where('m.anonymized_at IS NULL');
    if (query.status) qb.andWhere(query.status === 'active' ? 'm.active' : 'NOT m.active');
    if (query.ageCategory) qb.andWhere('m.age_category = :age', { age: query.ageCategory });
    return paginate(
      qb,
      query,
      {
        sortable: { name: 'm.lastName', memberNumber: 'm.memberNumber', joinedAt: 'm.joinedAt', email: 'm.email', ageCategory: 'm.ageCategory' },
        defaultSort: { key: 'name', order: 'asc' },
        search: ['m.email', 'm.firstName', 'm.lastName', 'm.memberNumber'],
      },
      toMember,
    );
  }

  async get(id: string) {
    return toMember(await this.find(id));
  }

  /** Back-office correction. A changed e-mail is carried to the linked account so sign-in keeps working. */
  async update(id: string, dto: UpdateMemberDto) {
    const member = await this.find(id);
    const keys = Object.keys(dto) as (keyof UpdateMemberDto)[];
    const before = Object.fromEntries(keys.map((key) => [key, member[key]]));
    if (keys.length) await this.tx.repo(Member).update(id, dto);
    if (dto.email && dto.email !== member.email.toLowerCase()) {
      await this.tx.repo(User).update({ memberId: id }, { email: dto.email });
    }
    const updated = await this.find(id);
    await this.audit.record({ action: 'MEMBER_UPDATED', entityType: 'Member', entityId: id, entityLabel: fullName(updated), before, after: { ...dto } });
    return toMember(updated);
  }

  /** The member leaves the active list; the linked account is closed and its sessions end. History is kept. */
  async deactivate(id: string) {
    const member = await this.find(id);
    if (!member.active) throw conflict('ALREADY_INACTIVE', 'Ce membre est déjà désactivé.');
    await this.tx.repo(Member).update(id, { active: false });
    const account = await this.tx.repo(User).findOneBy({ memberId: id });
    if (account) {
      await this.tx.repo(User).update(account.id, { active: false });
      await this.tx
        .repo(Session)
        .createQueryBuilder()
        .update()
        .set({ revokedAt: () => 'now()' })
        .where('user_id = :id AND revoked_at IS NULL', { id: account.id })
        .execute();
    }
    await this.audit.record({
      action: 'MEMBER_DEACTIVATED',
      entityType: 'Member',
      entityId: id,
      entityLabel: fullName(member),
      before: { active: true },
      after: { active: false, ...(account ? { accountClosed: true } : {}) },
    });
    return toMember(await this.find(id));
  }

  async find(id: string): Promise<Member> {
    const member = await this.tx.repo(Member).findOne({ where: { id }, relations: { consents: true } });
    if (!member || member.anonymizedAt) throw notFound('Membre introuvable.');
    return member;
  }

  async emailIsMember(email: string): Promise<boolean> {
    return this.tx
      .repo(Member)
      .createQueryBuilder('m')
      .where('lower(m.email) = lower(:email) AND m.anonymized_at IS NULL', { email })
      .getExists();
  }
}
