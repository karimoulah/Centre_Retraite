import type { Block } from 'payload';

import { actionField, textField, titleField } from '@/fields/common';

export const TestimonialsVideoGridBlock: Block = {
  slug: 'testimonialsVideoGrid',
  labels: { singular: 'Témoignages vidéo', plural: 'Témoignages vidéo' },
  admin: { group: 'Témoignages' },
  fields: [
    titleField(),
    textField,
    actionField(),
    { name: 'limit', label: 'Nombre de vidéos', type: 'number', defaultValue: 3, min: 1, max: 8 },
  ],
};
