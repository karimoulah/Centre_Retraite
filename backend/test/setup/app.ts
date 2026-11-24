import type { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

export type TestApp = { app: INestApplication; dataSource: DataSource; http: ReturnType<INestApplication['getHttpServer']> };

/** The real AppModule with the production pipeline (prefix, cookies, filters, guards). */
export async function createTestApp(extra: ModuleMetadata = {}): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule, ...(extra.imports ?? [])], ...extra }).compile();
  // rawBody: the Stripe webhook verifies its signature on the exact bytes received.
  const app = moduleRef.createNestApplication({ logger: false, rawBody: true });
  configureApp(app);
  await app.init();
  return { app, dataSource: app.get(DataSource), http: app.getHttpServer() };
}
