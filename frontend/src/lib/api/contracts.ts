/**
 * API contracts written by hand while the NestJS Swagger is not available.
 * Once `npm run api:types` works, these aliases point to `schema.d.ts` instead.
 * Every type here is listed under "Mocks en attente" in the tracking file.
 */

export const ROLES = ['ADMIN', 'FINANCE', 'TESTIMONIALS', 'MEMBER'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administration',
  FINANCE: 'Finances',
  TESTIMONIALS: 'Témoignages',
  MEMBER: 'Membre',
};

/** GET /auth/me */
export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
};

/** POST /auth/login */
export type LoginRequest = { email: string; password: string };
export type LoginResponse = { user: SessionUser };

/** Paginated list returned by every GET collection route. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** Query accepted by every paginated route. */
export type ListQuery = {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
};

/** GET /public/testimonials — approved testimonials (module F10). */
export type PublicTestimonial = {
  id: string;
  type: 'TEXT' | 'AUDIO' | 'VIDEO';
  authorName: string;
  authorDetail?: string;
  quote: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  publishedAt: string;
  /** Mock only: demo content that must be labelled as such on screen. */
  demo?: boolean;
};

/** POST /contact */
export type ContactRequest = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  turnstileToken: string;
};

/** Back-office user account (GET /users, GET /users/:id). */
export type UserAccount = SessionUser & {
  active: boolean;
  invitationPending: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

/** POST /users — sends an invitation e-mail; the person chooses a password. */
export type CreateUserRequest = Pick<SessionUser, 'email' | 'firstName' | 'lastName' | 'roles'>;
export type UpdateUserRequest = Pick<SessionUser, 'firstName' | 'lastName'>;
/** PUT /users/:id/roles */
export type UpdateRolesRequest = { roles: Role[] };

/** GET /audit-logs */
export type AuditEntry = {
  id: string;
  at: string;
  actor: { id: string; name: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

export const AGE_CATEGORIES = ['50_64', '65_74', '75_84', '85_PLUS'] as const;
export type AgeCategory = (typeof AGE_CATEGORIES)[number];
export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  '50_64': '50 à 64 ans',
  '65_74': '65 à 74 ans',
  '75_84': '75 à 84 ans',
  '85_PLUS': '85 ans et plus',
};

export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
};

/** POST /memberships */
export type MembershipApplication = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  ageCategory: AgeCategory;
  /** Optional: only used for birthday wishes. */
  birthDate?: string | null;
  birthdayWishesConsent: boolean;
  newsletterConsent: boolean;
  turnstileToken: string;
};

/** GET /memberships, GET /memberships/:id */
export type MembershipRequest = Omit<MembershipApplication, 'turnstileToken'> & {
  id: string;
  status: MembershipStatus;
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectionReason: string | null;
  memberId: string | null;
};

/** GET /settings/membership */
export type MembershipSettings = { autoApprove: boolean; updatedAt: string | null; updatedBy: string | null };

export type Consent = { granted: boolean; updatedAt: string | null };

/** GET /members, GET /members/:id */
export type Member = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  ageCategory: AgeCategory;
  birthDate: string | null;
  active: boolean;
  joinedAt: string;
  consents: { birthdayWishes: Consent; newsletter: Consent; testimonialPublication: Consent };
};

export type MemberConsentKey = keyof Member['consents'];

/** PATCH /members/:id (back-office) */
export type UpdateMemberRequest = Partial<Pick<Member, 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'ageCategory' | 'birthDate'>>;
/** PATCH /me/profile (member): only these fields are editable by the member. */
export type UpdateMyProfileRequest = Pick<Member, 'phone' | 'address'>;
/** PUT /me/consents */
export type UpdateConsentsRequest = Partial<Record<MemberConsentKey, boolean>>;

/* ------------------------------------------------------------------ Finances (sprint 2) */

export const ENTRY_DIRECTIONS = ['INCOME', 'EXPENSE'] as const;
export type EntryDirection = (typeof ENTRY_DIRECTIONS)[number];
export const DIRECTION_LABELS: Record<EntryDirection, string> = { INCOME: 'Recette', EXPENSE: 'Dépense' };

/** GET /categories (plain list, no pagination). `system`: used by online donations, stays active. */
export type Category = {
  id: string;
  name: string;
  direction: EntryDirection;
  receiptEligible: boolean;
  active: boolean;
  system: boolean;
  createdAt: string;
  updatedAt: string;
};
export type CreateCategoryRequest = Pick<Category, 'name' | 'direction' | 'receiptEligible'>;
export type UpdateCategoryRequest = Partial<Pick<Category, 'name' | 'receiptEligible' | 'active'>>;

export const CONTRIBUTOR_KINDS = ['INDIVIDUAL', 'ORGANIZATION'] as const;
export type ContributorKind = (typeof CONTRIBUTOR_KINDS)[number];
export const CONTRIBUTOR_KIND_LABELS: Record<ContributorKind, string> = { INDIVIDUAL: 'Personne', ORGANIZATION: 'Organisme' };

/** GET /contributors, GET /contributors/:id */
export type Contributor = {
  id: string;
  kind: ContributorKind;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  member: { id: string; memberNumber: string; name: string } | null;
  createdAt: string;
};
export type ContributorRequest = {
  kind: ContributorKind;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  memberId?: string | null;
};
