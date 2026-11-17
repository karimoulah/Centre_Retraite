import type { Block } from 'payload';

import { themeField } from '@/fields/common';

export const StatsBlock: Block = {
  slug: 'stats',
  labels: { singular: 'Chiffres clés', plural: 'Chiffres clés' },
  fields: [
    themeField,
    {
      name: 'items',
      label: 'Chiffres',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      fields: [
        { name: 'value', label: 'Valeur', type: 'text', required: true },
        { name: 'label', label: 'Légende', type: 'text', required: true },
      ],
    },
  ],
};
