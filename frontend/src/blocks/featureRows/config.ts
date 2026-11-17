import type { Block } from 'payload';

import { linkFields } from '@/fields/link';
import { imageField, textField, titleField } from '@/fields/common';

export const FeatureRowsBlock: Block = {
  slug: 'featureRows',
  labels: { singular: 'Activités phares (fond sombre)', plural: 'Activités phares' },
  fields: [
    titleField(),
    textField,
    {
      name: 'rows',
      label: 'Lignes',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'text', label: 'Texte', type: 'textarea' },
        imageField(),
        { name: 'link', label: 'Lien', type: 'group', fields: linkFields().map((f) => ('name' in f && f.name === 'label' ? { ...f, required: false } : f)) },
      ],
    },
  ],
};
