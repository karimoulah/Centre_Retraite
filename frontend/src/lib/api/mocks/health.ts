import { ok, type MockRoute } from './types';

export const healthRoutes: MockRoute[] = [
  { method: 'GET', path: '/v1/health', handler: () => ok({ status: 'ok', database: 'mock' }) },
];
