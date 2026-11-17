import { fail, mockStore, ok, type MockRoute } from './types';

const sent = () => mockStore<Map<string, number[]>>('contact-sent-by-email', () => new Map());

export const contactRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/contact',
    handler: ({ body }) => {
      const { turnstileToken, email } = (body ?? {}) as { turnstileToken?: string; email?: string };
      if (!turnstileToken) return fail(400, 'CAPTCHA_REQUIRED', 'La vérification anti-robot a échoué.');
      if (email?.endsWith('@invalide.test')) {
        return fail(422, 'VALIDATION_FAILED', 'Certains champs sont invalides.', [{ field: 'email', message: 'Cette adresse ne peut pas recevoir de courriel.' }]);
      }
      // Same rule as the API: at most 3 messages per minute from one address.
      const now = Date.now();
      const key = email ?? '';
      const recent = (sent().get(key) ?? []).filter((time) => now - time < 60_000);
      if (recent.length >= 3) return fail(429, 'TOO_MANY_REQUESTS', 'Limite atteinte.');
      sent().set(key, [...recent, now]);
      return ok({ received: true });
    },
  },
];
