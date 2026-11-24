import { Global, Module } from '@nestjs/common';

import { ENV, type Env } from '../../config/config.module';
import { BrevoMailService } from './brevo-mail.service';
import { MailService } from './mail.service';
import { MemoryMailService } from './memory-mail.service';
import { SmtpMailService } from './smtp-mail.service';

@Global()
@Module({
  providers: [
    {
      provide: MailService,
      inject: [ENV],
      useFactory: (env: Env): MailService => {
        switch (env.MAIL_TRANSPORT) {
          case 'brevo':
            return new BrevoMailService({ apiKey: env.BREVO_API_KEY!, from: env.MAIL_FROM, sandbox: env.BREVO_SANDBOX });
          case 'memory':
            return new MemoryMailService();
          default:
            return new SmtpMailService(env.SMTP_HOST, env.SMTP_PORT, env.MAIL_FROM);
        }
      },
    },
  ],
  exports: [MailService],
})
export class MailModule {}
