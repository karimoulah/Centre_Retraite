export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

/** Sends one e-mail. Implementations: Brevo (production), SMTP/Mailpit (development), memory (tests). */
export abstract class MailService {
  abstract send(message: MailMessage): Promise<void>;
}
