import type { Block } from 'payload';

import { imageField, themeField } from '@/fields/common';

export const LogoStripBlock: Block = {
  slug: 'logoStrip',
  labels: { singular: 'Bandeau de logos', plural: 'Bandeaux de logos' },
  fields: [
    themeField,
    { name: 'title', label: 'Titre (lu par les lecteurs d’écran)', type: 'text', defaultValue: 'Nos partenaires' },
    {
      name: 'logos',
      label: 'Partenaires',
      type: 'array',
      fields: [
        { name: 'name', label: 'Nom', type: 'text', required: true },
        imageField('logo', 'Logo (facultatif ; sinon le nom est affiché)'),
        { name: 'url', label: 'Site web', type: 'text' },
      ],
    },
  ],
};
