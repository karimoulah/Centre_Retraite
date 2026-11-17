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
