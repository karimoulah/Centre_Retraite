import { Controller, type INestApplication, Post, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { Public } from '../../src/common/public.decorator';
import { AuditLog, User } from '../../src/database/entities';
import { AuditService } from '../../src/modules/audit/audit.service';

@Controller('__test')
class AuditProbeController {
  constructor(private readonly audit: AuditService) {}

  @Public()
  @Post('create')
  async create(@Req() req: Request) {
    await this.audit.record({ action: 'PROBE_CREATED', entityType: 'Probe', entityId: String(req.body.id) });
    return { ok: true };
  }

  @Public()
  @Post('fail')
  async fail(@Req() req: Request) {
    await this.audit.record({ action: 'PROBE_FAILED', entityType: 'Probe', entityId: String(req.body.id) });
    throw new Error('rolled back');
  }
}

describe('Transactions and audit author (B0-04)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let actorId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [AuditProbeController] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    // Stand-in for the auth guard: the request is made by a known user.
    app.use((req: Request & { user?: { id: string } }, _res: Response, next: NextFunction) => {
      if (req.headers['x-test-user']) req.user = { id: String(req.headers['x-test-user']) };
      next();
    });
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    const user = await dataSource
      .getRepository(User)
      .save(dataSource.getRepository(User).create({ email: 'auteur@test.local', firstName: 'Auteur', lastName: 'Test' }));
    actorId = user.id;
  });

  afterAll(() => app.close());

  it('records the signed-in user as the author of a created row', async () => {
    await request(app.getHttpServer()).post('/api/v1/__test/create').set('x-test-user', actorId).send({ id: 1 }).expect(201);
    const line = await dataSource.getRepository(AuditLog).findOneByOrFail({ action: 'PROBE_CREATED' });
    expect(line.actorId).toBe(actorId);
  });

  it('leaves the author empty for an anonymous request', async () => {
    await request(app.getHttpServer()).post('/api/v1/__test/create').send({ id: 2 }).expect(201);
    const line = await dataSource.getRepository(AuditLog).findOneByOrFail({ action: 'PROBE_CREATED', entityId: '2' });
    expect(line.actorId).toBeNull();
  });

  it('rolls back every write of a failed request, audit line included', async () => {
    await request(app.getHttpServer()).post('/api/v1/__test/fail').set('x-test-user', actorId).send({ id: 3 }).expect(500);
    expect(await dataSource.getRepository(AuditLog).countBy({ action: 'PROBE_FAILED' })).toBe(0);
  });
});
