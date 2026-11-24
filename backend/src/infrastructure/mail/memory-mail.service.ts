import { MailService, type MailMessage } from './mail.service';

/** Keeps e-mails in memory so tests can read them. */
export class MemoryMailService extends MailService {
  readonly outbox: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.outbox.push(message);
  }

  /** Last e-mail sent to this address. */
  lastTo(address: string): MailMessage | undefined {
    return [...this.outbox].reverse().find((m) => m.to === address);
  }
}
