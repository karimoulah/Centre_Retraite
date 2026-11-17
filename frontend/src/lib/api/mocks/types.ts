export type MockRequest = {
  method: string;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  cookies: Map<string, string>;
};

export type MockResponse = {
  status: number;
  body?: unknown;
  setCookies?: string[];
};

export type MockRoute = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  handler: (request: MockRequest) => MockResponse | Promise<MockResponse>;
};

export const ok = (body?: unknown, setCookies?: string[]): MockResponse => ({
  status: 200,
  body,
  setCookies,
});

export const created = (body?: unknown): MockResponse => ({ status: 201, body });

export const fail = (status: number, code: string, message: string, details?: unknown) => ({
  status,
  body: { code, message, details },
});

/** Keeps mock data alive across hot reloads in development. */
export function mockStore<T>(key: string, init: () => T): T {
  const store = globalThis as unknown as Record<string, T>;
  const fullKey = `__lesaines_mock_${key}`;
  store[fullKey] ??= init();
  return store[fullKey];
}
