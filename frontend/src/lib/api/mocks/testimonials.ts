import type { PublicTestimonial } from '../contracts';
import { ok, paginate, type MockRoute } from './types';

/** Demo testimonials, flagged `demo: true` so the site shows a "Démonstration" label. */
const demo: PublicTestimonial[] = [
  { id: 't1', type: 'VIDEO', authorName: 'Gisèle M.', authorDetail: 'Membre depuis 2019', quote: 'Les cafés-rencontres du mardi ont changé ma semaine.', durationSeconds: 94, publishedAt: '2026-10-02T14:00:00Z' },
  { id: 't2', type: 'VIDEO', authorName: 'André L.', authorDetail: 'Bénévole', quote: 'Accompagner quelqu’un à ses rendez-vous, c’est simple et ça compte.', durationSeconds: 128, publishedAt: '2026-09-18T14:00:00Z' },
  { id: 't3', type: 'VIDEO', authorName: 'Famille Roy', authorDetail: 'Proches aidants', quote: 'On s’est sentis moins seuls.', durationSeconds: 75, publishedAt: '2026-09-04T14:00:00Z' },
  { id: 't4', type: 'VIDEO', authorName: 'Lucien B.', authorDetail: 'Membre', quote: 'Le groupe de marche m’a remis sur pied.', durationSeconds: 61, publishedAt: '2026-08-21T14:00:00Z' },
  { id: 't5', type: 'TEXT', authorName: 'Monique T.', authorDetail: 'Membre depuis 2021', quote: 'Une équipe chaleureuse et patiente. On m’a aidée à remplir mes formulaires sans jamais me presser.', publishedAt: '2026-10-10T14:00:00Z' },
  { id: 't6', type: 'TEXT', authorName: 'Pierre-Yves D.', authorDetail: 'Fils d’une membre', quote: 'Ma mère attend les activités avec impatience. Elle s’y est fait de vraies amies.', publishedAt: '2026-09-28T14:00:00Z' },
  { id: 't7', type: 'TEXT', authorName: 'Rachida K.', authorDetail: 'Membre', quote: 'Les ateliers sur la tablette m’ont permis de parler à mes petits-enfants en vidéo.', publishedAt: '2026-09-12T14:00:00Z' },
].map((item) => ({ ...item, type: item.type as PublicTestimonial['type'], demo: true }));

export const testimonialRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/public/testimonials',
    handler: ({ query }) => {
      const type = query.get('type');
      const items = type ? demo.filter((t) => t.type === type) : demo;
      return ok(paginate(items, query, ['authorName', 'quote']));
    },
  },
];
