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
