import type { Block } from 'payload';

import { actionField, imageField } from '@/fields/common';

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Héros', plural: 'Héros' },
  fields: [
    { name: 'badge', label: 'Note ou mention', type: 'text', admin: { description: 'Par exemple « 4,9/5 · 810 avis ». Facultatif.' } },
    { name: 'title', label: 'Titre (2 lignes)', type: 'textarea', required: true },
    { name: 'text', label: 'Texte', type: 'textarea' },
    actionField('primaryAction', "Bouton d'action"),
    imageField('image', 'Photo'),
    { name: 'medallion', label: 'Texte du médaillon tournant', type: 'text', defaultValue: 'LES AÎNÉS • ENTRAIDE • ÉCOUTE •' },
  ],
};
