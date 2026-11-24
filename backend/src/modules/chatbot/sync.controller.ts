import { createHmac, timingSafeEqual } from 'node:crypto';

import { InjectQueue } from '@nestjs/bullmq';
import { Body, Controller, Headers, HttpCode, Inject, Post, type RawBodyRequest, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Queue } from 'bullmq';
import type { Request } from 'express';
import { createZodDto } from 'nestjs-zod';

import { AppError } from '../../common/app-error';
import { Public } from '../../common/public.decorator';
import { z } from '../../common/zod';
import { ENV, type Env } from '../../config/config.module';
import { CHATBOT_QUEUE, type SyncJob } from './chatbot.constants';

class SyncDto extends createZodDto(
  z
    .object({
      event: z.enum(['upsert', 'delete']),
      page: z.object({
        id: z.coerce.string().min(1),
        slug: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        url: z.string().min(1).optional(),
        layout: z.unknown().optional(),
        meta: z
          .object({
            description: z
              .string()
              .nullish()
              .transform((v) => v ?? undefined),
          })
          .partial()
          .nullish()
          .transform((v) => v ?? undefined),
      }),
    })
    .refine((b) => b.event === 'delete' || (b.page.slug && b.page.title && b.page.url), {
      message: 'slug, title and url are required to index a page',
      path: ['page'],
    }),
) {}

/**
 * Payload → API when a page is published, changed, unpublished or deleted (B11-01).
 * Signed with HMAC-SHA256 of the raw body (header x-signature: sha256=<hex>). Answers at once;
 * the worker re-indexes the page within seconds (well under the 5-minute target).
 */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller('internal/chatbot')
export class ChatbotSyncController {
  constructor(
    @InjectQueue(CHATBOT_QUEUE) private readonly queue: Queue<SyncJob>,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @HttpCode(202)
  @Post('sync')
  async sync(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: SyncDto,
    @Headers('x-signature') signature?: string,
  ) {
    this.verify(req.rawBody ?? Buffer.alloc(0), signature);
    const job = body as unknown as SyncJob;
    await this.queue.add(job.event, job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
    return { queued: true };
  }

  private verify(raw: Buffer, signature: string | undefined) {
    const expected = Buffer.from(
      `sha256=${createHmac('sha256', this.env.CHATBOT_SYNC_SECRET).update(raw).digest('hex')}`,
    );
    const given = Buffer.from(signature ?? '');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new AppError(401, 'INVALID_SIGNATURE', 'Signature invalide.');
    }
  }
}
