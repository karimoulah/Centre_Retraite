import { Injectable } from '@nestjs/common';

import { notFound } from '../../common/app-error';
import { Tx } from '../../common/transaction/transaction.service';
import { Consent, type ConsentType, Member, type MembershipRequest } from '../../database/entities';

@Injectable()
export class MembersService {
  constructor(private readonly tx: Tx) {}

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

  async find(id: string): Promise<Member> {
    const member = await this.tx.repo(Member).findOne({ where: { id }, relations: { consents: true } });
    if (!member) throw notFound('Membre introuvable.');
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
