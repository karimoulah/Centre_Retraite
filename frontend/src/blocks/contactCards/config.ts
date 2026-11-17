import type { Block } from 'payload';

export const ContactCardsBlock: Block = {
  slug: 'contactCards',
  labels: { singular: 'Cartes contact', plural: 'Cartes contact' },
  fields: [
    {
      name: 'title',
      label: 'Titre',
      type: 'text',
      defaultValue: 'Nous joindre',
      admin: { description: 'Les coordonnées viennent des réglages du site.' },
    },
  ],
};
