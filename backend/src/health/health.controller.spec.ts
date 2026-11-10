import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('indique ok quand la base répond', async () => {
    const c = new HealthController({ $queryRaw: jest.fn().mockResolvedValue([1]) } as never);
    expect(await c.check()).toMatchObject({ status: 'ok', database: 'up' });
  });
  it('indique degraded quand la base ne répond pas', async () => {
    const c = new HealthController({ $queryRaw: jest.fn().mockRejectedValue(new Error('x')) } as never);
    expect(await c.check()).toMatchObject({ status: 'degraded', database: 'down' });
  });
});
