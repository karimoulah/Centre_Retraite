import { createTransport, type Transporter } from 'nodemailer';

import { MailService, type MailMessage } from './mail.service';

/** Plain SMTP; in development it points at Mailpit (inbox at http://localhost:8025). */
export class SmtpMailService extends MailService {
  private readonly transport: Transporter;

  constructor(host: string, port: number, private readonly from: string) {
    super();
    this.transport = createTransport({ host, port, secure: false, ignoreTLS: true });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({ from: this.from, ...message });
  }
}
