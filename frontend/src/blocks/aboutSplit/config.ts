import type { Block } from 'payload';

import { eyebrowField, imageField, textField, titleField } from '@/fields/common';

export const AboutSplitBlock: Block = {
  slug: 'aboutSplit',
  labels: { singular: 'Présentation', plural: 'Présentations' },
  fields: [
    eyebrowField,
    titleField(),
    textField,
    imageField(),
    {
      name: 'highlight',
      label: 'Encadré chiffré',
      type: 'group',
      fields: [
        { name: 'value', label: 'Valeur', type: 'text' },
        { name: 'label', label: 'Légende', type: 'text' },
      ],
    },
    {
      name: 'items',
      label: 'Liste dépliable',
      type: 'array',
      fields: [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'content', label: 'Texte', type: 'textarea', required: true },
      ],
    },
    {
      name: 'showUpcomingActivities',
      label: 'Afficher les prochaines activités à droite',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
