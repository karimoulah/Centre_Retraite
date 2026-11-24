import { Inject, Injectable, Logger } from '@nestjs/common';

import { AppError } from '../../common/app-error';
import { ENV, type Env } from '../../config/config.module';

/** Cloudflare Turnstile, verified on the server. Without a secret key (development, tests) any token is accepted. */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  async verify(token: string | undefined, ip?: string): Promise<void> {
    if (!token) throw new AppError(400, 'CAPTCHA_REQUIRED', 'La vérification anti-robot a échoué. Réessayez.');
    if (!this.env.TURNSTILE_SECRET_KEY) return;
    const body = new URLSearchParams({ secret: this.env.TURNSTILE_SECRET_KEY, response: token, ...(ip ? { remoteip: ip } : {}) });
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
      const result = (await response.json()) as { success?: boolean };
      if (result.success) return;
    } catch (error) {
      this.logger.warn(`Turnstile unreachable: ${String(error)}`);
    }
    throw new AppError(400, 'CAPTCHA_REQUIRED', 'La vérification anti-robot a échoué. Réessayez.');
  }
}
