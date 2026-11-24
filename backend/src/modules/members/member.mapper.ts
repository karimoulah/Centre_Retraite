import type { Consent, ConsentType, Member } from '../../database/entities';

export type ConsentView = { granted: boolean; updatedAt: string | null };
export const CONSENT_KEYS = {
  birthdayWishes: 'BIRTHDAY_WISHES',
  newsletter: 'NEWSLETTER',
  testimonialPublication: 'TESTIMONIAL_PUBLICATION',
} as const satisfies Record<string, ConsentType>;
export type ConsentKey = keyof typeof CONSENT_KEYS;

/** Active consent → granted since grantedAt; otherwise the last withdrawal, or never given. */
export function consentView(consents: Consent[] = [], type: ConsentType): ConsentView {
  const ofType = consents.filter((c) => c.type === type);
  const active = ofType.find((c) => !c.withdrawnAt);
  if (active) return { granted: true, updatedAt: active.grantedAt.toISOString() };
  const last = ofType.sort((a, b) => b.withdrawnAt!.getTime() - a.withdrawnAt!.getTime())[0];
  return { granted: false, updatedAt: last?.withdrawnAt?.toISOString() ?? null };
}

export const toConsents = (consents: Consent[] = []) =>
  Object.fromEntries(Object.entries(CONSENT_KEYS).map(([key, type]) => [key, consentView(consents, type)])) as Record<
    ConsentKey,
    ConsentView
  >;

/** GET /members, GET /members/:id, GET /me/profile */
export const toMember = (m: Member) => ({
  id: m.id,
  memberNumber: m.memberNumber,
  firstName: m.firstName,
  lastName: m.lastName,
  name: `${m.lastName} ${m.firstName}`,
  email: m.email,
  phone: m.phone,
  address: m.address,
  ageCategory: m.ageCategory,
  birthDate: m.birthDate,
  active: m.active,
  joinedAt: m.joinedAt.toISOString(),
  consents: toConsents(m.consents),
});
