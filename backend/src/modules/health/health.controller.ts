import { Controller, Get, HttpCode, Inject, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type Redis from 'ioredis';
import { DataSource } from 'typeorm';

import { Public } from '../../common/public.decorator';
import { REDIS } from '../../infrastructure/redis/redis.module';

type Check = 'up' | 'down';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /** 200 when the database and Redis answer, 503 otherwise. */
  @Public()
  @Get()
  @HttpCode(200)
  async check(@Res({ passthrough: true }) res: Response) {
    const [database, redis] = await Promise.all([
      this.probe(() => this.dataSource.query('SELECT 1')),
      this.probe(() => this.redis.ping()),
    ]);
    const status = database === 'up' && redis === 'up' ? 'ok' : 'error';
    if (status === 'error') res.status(503);
    return { status, database, redis };
  }

  private async probe(fn: () => Promise<unknown>): Promise<Check> {
    try {
      await Promise.race([fn(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))]);
      return 'up';
    } catch {
      return 'down';
    }
  }
}
