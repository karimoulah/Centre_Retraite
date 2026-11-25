import type { MembershipRequest } from '../../database/entities';
import { fullName } from '../users/user.mapper';

/** GET /memberships, GET /memberships/:id */
export const toMembershipRequest = (r: MembershipRequest) => ({
  id: r.id,
  firstName: r.firstName,
  lastName: r.lastName,
  name: `${r.lastName} ${r.firstName}`,
  email: r.email,
  phone: r.phone,
  address: r.address,
  sex: r.sex,
  ageCategory: r.ageCategory,
  birthDate: r.birthDate,
  birthdayWishesConsent: r.birthdayWishesConsent,
  newsletterConsent: r.newsletterConsent,
  status: r.status,
  submittedAt: r.submittedAt.toISOString(),
  decidedAt: r.decidedAt?.toISOString() ?? null,
  decidedBy: r.decidedAutomatically ? 'Approbation automatique' : r.decidedBy ? fullName(r.decidedBy) : null,
  rejectionReason: r.rejectionReason,
  memberId: r.memberId,
});
