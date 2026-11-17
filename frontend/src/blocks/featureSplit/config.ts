import type { Block } from 'payload';

import { linkFields } from '@/fields/link';
import { actionField, imageField } from '@/fields/common';

export const FeatureSplitBlock: Block = {
  slug: 'featureSplit',
  labels: { singular: 'Mission et engagements', plural: 'Missions et engagements' },
  fields: [
    imageField(),
    { name: 'title', label: 'Titre', type: 'textarea', required: true },
    actionField(),
    {
      name: 'cards',
      label: 'Cartes numérotées',
      type: 'array',
      maxRows: 2,
      fields: [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'text', label: 'Texte', type: 'textarea' },
        { name: 'link', label: 'Lien (facultatif)', type: 'group', fields: linkFields().map((f) => ('name' in f && f.name === 'label' ? { ...f, required: false } : f)) },
      ],
    },
  ],
};
