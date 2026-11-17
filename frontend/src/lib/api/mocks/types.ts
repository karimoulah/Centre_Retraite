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

/** Server-side search, sort and pagination over an in-memory list (mirrors the API's behaviour). */
export function paginate<T extends Record<string, unknown>>(
  items: T[],
  query: URLSearchParams,
  searchFields: (keyof T)[] = [],
) {
  const q = query.get('q')?.toLowerCase().trim();
  let result = q
    ? items.filter((item) => searchFields.some((field) => String(item[field] ?? '').toLowerCase().includes(q)))
    : [...items];
  const sort = query.get('sort');
  if (sort) {
    const direction = query.get('order') === 'desc' ? -1 : 1;
    result.sort((a, b) => String(a[sort] ?? '').localeCompare(String(b[sort] ?? ''), 'fr-CA', { numeric: true }) * direction);
  }
  const pageSize = Number(query.get('pageSize')) || 25;
  const page = Math.max(1, Number(query.get('page')) || 1);
  const total = result.length;
  result = result.slice((page - 1) * pageSize, page * pageSize);
  return { items: result, total, page, pageSize };
}
