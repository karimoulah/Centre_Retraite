import type { Block } from 'payload';

export const ContentBlock: Block = {
  slug: 'content',
  labels: { singular: 'Texte riche', plural: 'Textes riches' },
  fields: [
    { name: 'title', label: 'Titre (facultatif)', type: 'text' },
    { name: 'body', label: 'Contenu', type: 'richText', required: true },
  ],
};
