/**
 * Reads the expiry of a JWT without verifying it (verification is the API's job).
 * Edge-safe: used by the middleware to refresh the session before it expires.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(atob(base64)) as T;
  } catch {
    return null;
  }
}

/** True when the token is missing, unreadable or expires within `marginSeconds`. */
export function isTokenExpired(token: string | undefined, marginSeconds = 30): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + marginSeconds * 1000;
}

const toBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Unsigned JWT-shaped token used only by the mock API. */
export function encodeMockToken(payload: Record<string, unknown>): string {
  return `${toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${toBase64Url(JSON.stringify(payload))}.mock`;
}
