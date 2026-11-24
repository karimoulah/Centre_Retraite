import { Body, Controller, HttpCode, Inject, Ip, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createHash } from 'node:crypto';
import { createZodDto } from 'nestjs-zod';

import { Public } from '../../common/public.decorator';
import { z } from '../../common/zod';
import { ENV, type Env } from '../../config/config.module';
import { RateLimitService } from '../../infrastructure/rate-limit/rate-limit.service';
import { TurnstileService } from '../../infrastructure/turnstile/turnstile.service';
import { NotificationsService } from '../notifications/notifications.service';

class ContactDto extends createZodDto(
  z.object({
    name: z.string().trim().min(2, 'Indiquez votre nom.').max(120),
    email: z.email().trim().toLowerCase(),
    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .transform((value) => value || null),
    subject: z.string().trim().min(3, 'Indiquez un objet.').max(150),
    message: z.string().trim().min(10, 'Le message doit contenir au moins 10 caractères.').max(5000),
    turnstileToken: z.string().min(1, 'La vérification anti-robot est obligatoire.').max(2048),
  }),
) {}

/** Public contact form: the message is e-mailed to the centre (reply goes to the sender). Nothing is stored. */
@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly turnstile: TurnstileService,
    private readonly limits: RateLimitService,
    private readonly notifications: NotificationsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Public()
  @HttpCode(200)
  @Post()
  async send(@Body() body: ContactDto, @Ip() ip: string) {
    await this.limits.hit(`contact:ip:${ip}`, 5, 60);
    await this.limits.hit(`contact:email:${body.email}`, 3, 60);
    await this.turnstile.verify(body.turnstileToken, ip);
    const { turnstileToken: _token, ...message } = body;
    const key = createHash('sha256').update(`${body.email}\n${body.subject}\n${body.message}\n${Math.floor(Date.now() / 60_000)}`).digest('hex');
    await this.notifications.schedule('CONTACT_MESSAGE', this.env.CENTER_EMAIL, message, `contact:${key}`);
    return { received: true };
  }
}
