import type { Block } from 'payload';

import { textField, titleField } from '@/fields/common';

export const TestimonialCarouselBlock: Block = {
  slug: 'testimonialCarousel',
  labels: { singular: "Carrousel d'avis", plural: "Carrousels d'avis" },
  admin: { group: 'Témoignages' },
  fields: [titleField(), textField, { name: 'limit', label: "Nombre d'avis", type: 'number', defaultValue: 6, min: 1, max: 12 }],
};
