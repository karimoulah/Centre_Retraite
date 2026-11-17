/** Cookie names set by the NestJS API (JWT in httpOnly, Secure, SameSite=Lax cookies). */
export const ACCESS_COOKIE = process.env.AUTH_ACCESS_COOKIE ?? 'access_token';
export const REFRESH_COOKIE = process.env.AUTH_REFRESH_COOKIE ?? 'refresh_token';

/** Areas that require a session; the middleware redirects to /login without one. */
export const PROTECTED_PREFIXES = ['/backoffice', '/account', '/admin', '/preview'];

/** Team roles that may enter the back-office. */
export const STAFF_ROLES = ['ADMIN', 'FINANCE', 'TESTIMONIALS'] as const;
