import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { AppError } from '../../common/app-error';
import { ENV, type Env } from '../../config/config.module';
import { REDIS } from '../redis/redis.module';

/** Fixed-window counter in Redis, shared by every API instance. */
@Injectable()
export class RateLimitService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Throws 429 TOO_MANY_REQUESTS once `limit` hits are reached in `windowSeconds` for this key. */
  async hit(key: string, limit: number, windowSeconds: number): Promise<void> {
    const name = `lesaines-${this.env.NODE_ENV}:rate:${key}`;
    const [[, count]] = (await this.redis.multi().incr(name).expire(name, windowSeconds, 'NX').exec()) as [[null, number]];
    if (count > limit) {
      throw new AppError(429, 'TOO_MANY_REQUESTS', 'Trop de tentatives. Réessayez dans quelques minutes.');
    }
  }
}
