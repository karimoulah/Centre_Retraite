import type { DonationCheckoutRequest, DonationStatus } from '../contracts';
import { created, fail, mockStore, ok, type MockRoute } from './types';

const sessions = () => mockStore<Map<string, DonationStatus>>('donationSessions', () => new Map());

/** Mock mode: no payment page; the gift is confirmed at once and the browser returns to the thank-you page. */
export const donationRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/donations/checkout',
    handler: ({ body }) => {
      const data = body as DonationCheckoutRequest;
      if (!data.turnstileToken)
        return fail(400, 'CAPTCHA_REQUIRED', 'La vérification anti-robot a échoué.');
      if (!Number.isInteger(data.amountCents) || data.amountCents < 500) {
        return fail(422, 'VALIDATION_FAILED', 'Certains champs sont invalides.', [
          { field: 'amountCents', message: 'Le don minimum est de 5 $.' },
        ]);
      }
      const sessionId = `cs_mock_${Date.now()}`;
      sessions().set(sessionId, {
        status: data.donorName.toLowerCase().includes('attente') ? 'PENDING' : 'CONFIRMED',
        amountCents: data.amountCents,
      });
      return created({ url: `/donate/thank-you?session_id=${sessionId}` });
    },
  },
  {
    method: 'GET',
    path: '/donations/sessions/:sessionId',
    handler: ({ params }) => {
      const session = sessions().get(params.sessionId);
      return session ? ok(session) : fail(404, 'NOT_FOUND', 'Don introuvable.');
    },
  },
];
