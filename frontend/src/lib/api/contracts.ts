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

export const SEXES = ['MALE', 'FEMALE'] as const;
export type Sex = (typeof SEXES)[number];
export const SEX_LABELS: Record<Sex, string> = { MALE: 'Masculin', FEMALE: 'Féminin' };

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
  /** Phone, address and birth date are required since November 2026; older requests may have none. */
  phone?: string;
  address?: string;
  sex: Sex;
  ageCategory: AgeCategory;
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
  /** Empty for members registered before the field existed. */
  sex: Sex | null;
  ageCategory: AgeCategory;
  birthDate: string | null;
  active: boolean;
  joinedAt: string;
  consents: { birthdayWishes: Consent; newsletter: Consent; testimonialPublication: Consent };
};

export type MemberConsentKey = keyof Member['consents'];

/** PATCH /members/:id (back-office) */
export type UpdateMemberRequest = Partial<Pick<Member, 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'sex' | 'ageCategory' | 'birthDate'>>;
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

export const ENTRY_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'VALIDATED'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];
export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'À approuver',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  VALIDATED: 'Validée',
};
export const PAYMENT_METHODS = ['CASH', 'CHEQUE', 'CARD', 'TRANSFER', 'ONLINE', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Argent comptant',
  CHEQUE: 'Chèque',
  CARD: 'Carte',
  TRANSFER: 'Virement',
  ONLINE: 'En ligne',
  OTHER: 'Autre',
};
/** Methods a person can enter by hand; ONLINE is reserved to online donations. */
export const MANUAL_PAYMENT_METHODS = ['CASH', 'CHEQUE', 'CARD', 'TRANSFER', 'OTHER'] as const;

type Person = { id: string; name: string } | null;
type EntryLink = { id: string; reference: string } | null;

/** GET /entries items. Amounts in cents; a reversal has the opposite (negative) amount. */
export type Entry = {
  id: string;
  reference: string;
  direction: EntryDirection;
  status: EntryStatus;
  amountCents: number;
  entryDate: string;
  category: { id: string; name: string };
  contributor: { id: string; name: string } | null;
  supplier: string | null;
  paymentMethod: PaymentMethod;
  project: string | null;
  description: string;
  source: 'MANUAL' | 'ONLINE';
  attachment: { name: string; type: string; size: number; url?: string | null } | null;
  reverses: EntryLink;
  reversedBy: EntryLink;
  reversalReason: string | null;
  createdBy: Person;
  createdAt: string;
  decidedBy: Person;
  decidedAt: string | null;
  rejectionReason: string | null;
  validatedBy: Person;
  validatedAt: string | null;
};

/** Totals of the whole filtered selection, not only the page. */
export type EntryTotals = { count: number; incomeCents: number; expenseCents: number; balanceCents: number };
export type EntriesPage = Paginated<Entry> & { totals: EntryTotals };

/** GET /entries/:id */
export type EntryDetail = Entry & {
  history: { at: string; action: string; actor: Person; before?: Record<string, unknown> | null; after?: Record<string, unknown> | null }[];
};

export type EntriesQuery = ListQuery & {
  from?: string;
  to?: string;
  categoryId?: string;
  contributorId?: string;
  direction?: EntryDirection;
  status?: EntryStatus;
  paymentMethod?: PaymentMethod;
  project?: string;
};

/** POST /entries (income) and POST /expenses. Amount in cents. */
export type EntryRequest = {
  amountCents: number;
  entryDate: string;
  categoryId: string;
  paymentMethod: (typeof MANUAL_PAYMENT_METHODS)[number];
  description: string;
  project?: string | null;
  contributorId?: string | null;
  supplier?: string;
};

/** POST /entries/:id/attachment → the browser PUTs the file to uploadUrl, then confirms. */
export type AttachmentUpload = { key: string; uploadUrl: string; method: 'PUT'; headers: Record<string, string>; expiresAt: string };
export const ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** GET /settings/finance (finance and admin) — expenses above the threshold need a second person. */
export type FinanceSettings = { expenseApprovalThresholdCents: number; updatedAt: string | null; updatedBy: string | null };

/* ------------------------------------------------------------------ Dons en ligne (sprint 2) */

/** POST /donations/checkout → the browser goes to the provider's payment page (Stripe Checkout). */
export type DonationCheckoutRequest = { amountCents: number; donorName: string; donorEmail: string; turnstileToken: string };
export type DonationCheckout = { url: string };
export const DONATION_PRESETS_CENTS = [2_500, 5_000, 10_000, 25_000] as const;
export const MIN_DONATION_CENTS = 500;

/** GET /donations/sessions/:sessionId — status shown on the thank-you page. */
export type DonationStatus = { status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED' | 'REFUNDED'; amountCents: number };
