import 'server-only';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { parseSetCookie } from './cookies';
import { ApiError, toApiError } from './errors';
import { handleMock } from './mocks';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type ApiOptions = {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** On 401, send the user to /login?next=… (default: true for GET, false otherwise). */
  redirectOnUnauthorized?: boolean;
  /** Re-apply Set-Cookie headers from the API (login, logout, refresh). Server Actions only. */
  forwardSetCookies?: boolean;
};

export const apiMode = (): 'mock' | 'live' => (process.env.API_MODE === 'mock' ? 'mock' : 'live');

function buildQuery(query: ApiOptions['query']): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return params;
}

async function send(path: string, options: ApiOptions) {
  const method = options.method ?? 'GET';
  const query = buildQuery(options.query);
  const cookieStore = await cookies();

  if (apiMode() === 'mock') {
    const response = await handleMock({
      method,
      path,
      query,
      body: options.body,
      cookies: new Map(cookieStore.getAll().map((c) => [c.name, c.value])),
    });
    return { status: response.status, data: response.body, setCookies: response.setCookies ?? [] };
  }

  const baseUrl = process.env.API_URL ?? 'http://localhost:3000/api';
  const url = `${baseUrl}${path}${query.size ? `?${query}` : ''}`;
  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
      cookie: cookieStore.toString(),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });
  const text = await response.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = { message: text };
  }
  return { status: response.status, data, setCookies: response.headers.getSetCookie() };
}

/**
 * The only entry point to the NestJS API. Forwards the session cookie, normalizes errors
 * into ApiError and, in mock mode (API_MODE=mock), answers from src/lib/api/mocks.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { status, data, setCookies } = await send(path, options);

  if (options.forwardSetCookies && setCookies.length) {
    const cookieStore = await cookies();
    for (const header of setCookies) {
      const { name, value, options: cookieOptions } = parseSetCookie(header);
      cookieStore.set(name, value, cookieOptions);
    }
  }

  if (status >= 200 && status < 300) return data as T;

  const error = toApiError(status, data);
  const redirectOnUnauthorized = options.redirectOnUnauthorized ?? (options.method ?? 'GET') === 'GET';
  if (status === 401 && redirectOnUnauthorized) {
    const pathname = (await headers()).get('x-pathname') ?? '/';
    redirect(`/login?next=${encodeURIComponent(pathname)}&reason=expired`);
  }
  throw error;
}

export { ApiError };
