import type { Block } from 'payload';

import { linkFields } from '@/fields/link';
import { actionField, eyebrowField, imageField, titleField } from '@/fields/common';

export const ServicesListBlock: Block = {
  slug: 'servicesList',
  labels: { singular: 'Liste de services', plural: 'Listes de services' },
  fields: [
    eyebrowField,
    titleField(),
    actionField(),
    {
      name: 'services',
      label: 'Services',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', label: 'Nom du service', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        imageField(),
        { name: 'link', label: 'Lien « En savoir plus »', type: 'group', fields: linkFields().map((f) => ('name' in f && f.name === 'label' ? { ...f, required: false } : f)) },
      ],
    },
  ],
};
