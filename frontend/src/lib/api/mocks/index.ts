import { auditRoutes } from './audit';
import { authRoutes, passwordRoutes } from './auth';
import { contactRoutes } from './contact';
import { entryReadRoutes } from './entries';
import { categoryRoutes, contributorRoutes } from './finance';
import { healthRoutes } from './health';
import { membershipRoutes } from './memberships';
import { testimonialRoutes } from './testimonials';
import { userRoutes } from './users';
import type { MockRequest, MockResponse, MockRoute } from './types';

/**
 * Mock API used while API_MODE=mock. Each module registers its routes here;
 * components never know whether data comes from a mock or from NestJS.
 */
const routes: MockRoute[] = [...healthRoutes, ...authRoutes, ...passwordRoutes, ...testimonialRoutes, ...contactRoutes, ...userRoutes, ...membershipRoutes, ...auditRoutes, ...categoryRoutes, ...contributorRoutes, ...entryReadRoutes];

function match(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    else if (patternParts[i] !== pathParts[i]) return null;
  }
  return params;
}

export async function handleMock(request: Omit<MockRequest, 'params'>): Promise<MockResponse> {
  // A short delay so loading states are visible during development.
  await new Promise((resolve) => setTimeout(resolve, 120));
  for (const route of routes) {
    if (route.method !== request.method) continue;
    const params = match(route.path, request.path);
    if (params) return route.handler({ ...request, params });
  }
  return {
    status: 404,
    body: { code: 'MOCK_NOT_FOUND', message: `Aucun mock pour ${request.method} ${request.path}` },
  };
}
