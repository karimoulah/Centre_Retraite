import { MailService, type MailMessage } from './mail.service';

type BrevoOptions = { apiKey: string; from: string; sandbox: boolean; fetchImpl?: typeof fetch };

/** "Les Aînés <a@b.c>" → { name, email } */
export function parseAddress(address: string): { name?: string; email: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(address);
  return match ? { name: match[1] || undefined, email: match[2] } : { email: address.trim() };
}

/** Brevo transactional API. In sandbox mode Brevo validates the request but delivers nothing. */
export class BrevoMailService extends MailService {
  constructor(private readonly options: BrevoOptions) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    const response = await (this.options.fetchImpl ?? fetch)('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.options.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: parseAddress(this.options.from),
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        ...(message.html ? { htmlContent: message.html } : {}),
        ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
        ...(this.options.sandbox ? { headers: { 'X-Sib-Sandbox': 'drop' } } : {}),
      }),
    });
    if (!response.ok) throw new Error(`Brevo refused the e-mail (${response.status}): ${await response.text()}`);
  }
}
