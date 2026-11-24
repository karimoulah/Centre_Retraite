import request from 'supertest';

import { IS_PUBLIC } from '../../src/common/public.decorator';
import { ROLES_KEY } from '../../src/common/roles.decorator';
import { createTestApp, type TestApp } from '../setup/app';
import { loginAs } from '../setup/auth';

type Route = { method: string; path: string; isPublic: boolean; roles: string[] };

/** Every route the app exposes, read from Nest's own metadata (so new routes are covered automatically). */
function listRoutes(t: TestApp): Route[] {
  const { DiscoveryService, MetadataScanner, Reflector } = jest.requireActual('@nestjs/core');
  const discovery = t.app.get(DiscoveryService);
  const scanner = new MetadataScanner();
  const reflector = t.app.get(Reflector);
  const routes: Route[] = [];
  for (const wrapper of discovery.getControllers()) {
    const { instance, metatype } = wrapper;
    if (!instance || !metatype) continue;
    const base = Reflect.getMetadata('path', metatype) as string;
    for (const name of scanner.getAllMethodNames(Object.getPrototypeOf(instance))) {
      const handler = instance[name];
      const path = Reflect.getMetadata('path', handler);
      const method = Reflect.getMetadata('method', handler);
      if (path === undefined || method === undefined) continue;
      routes.push({
        method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'][method] ?? 'GET',
        path: `/api/v1/${base}/${path}`.replace(/\/+/g, '/').replace(/\/$/, '').replace(/:[a-zA-Z]+/g, '00000000-0000-4000-8000-000000000000'),
        isPublic: !!reflector.getAllAndOverride(IS_PUBLIC, [handler, metatype]),
        roles: reflector.getAllAndOverride(ROLES_KEY, [handler, metatype]) ?? [],
      });
    }
  }
  return routes;
}

describe('Global guards (B1-08)', () => {
  let t: TestApp;
  let routes: Route[];
  beforeAll(async () => {
    t = await createTestApp({ providers: [jest.requireActual('@nestjs/core').DiscoveryService] });
    routes = listRoutes(t);
  });
  afterAll(() => t.app.close());

  it('finds the routes to check', () => {
    expect(routes.length).toBeGreaterThan(1);
  });

  it('refuses every non-public route without a session (401)', async () => {
    for (const route of routes.filter((r) => !r.isPublic)) {
      const res = await request(t.http)[route.method.toLowerCase() as 'get'](route.path);
      expect({ route: `${route.method} ${route.path}`, status: res.status }).toEqual({
        route: `${route.method} ${route.path}`,
        status: 401,
      });
    }
  });

  it('refuses every role-restricted route to a user without the role (403)', async () => {
    const restricted = routes.filter((r) => !r.isPublic && r.roles.length);
    const { cookies: cookie } = await loginAs(t, []);
    for (const route of restricted) {
      const res = await request(t.http)[route.method.toLowerCase() as 'get'](route.path).set('Cookie', cookie);
      expect({ route: `${route.method} ${route.path}`, status: res.status }).toEqual({
        route: `${route.method} ${route.path}`,
        status: 403,
      });
    }
  });

  it('rejects a forged token', async () => {
    const forged = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4IiwidHlwIjoiYWNjZXNzIn0.c2lnbmF0dXJl';
    const protectedRoute = routes.find((r) => !r.isPublic);
    if (!protectedRoute) return;
    await request(t.http).get(protectedRoute.path).set('Cookie', `access_token=${forged}`).expect(401);
  });
});
