import type { Field } from 'payload';

/** Link to an internal page or to an external address. */
export const linkFields = (options: { required?: boolean } = {}): Field[] => [
  { name: 'label', label: 'Libellé', type: 'text', required: true },
  {
    name: 'type',
    label: 'Type de lien',
    type: 'radio',
    defaultValue: 'page',
    options: [
      { label: 'Page du site', value: 'page' },
      { label: 'Adresse (URL)', value: 'url' },
    ],
    admin: { layout: 'horizontal' },
  },
  {
    name: 'page',
    label: 'Page',
    type: 'relationship',
    relationTo: 'pages',
    required: options.required,
    admin: { condition: (_, sibling) => sibling?.type !== 'url' },
  },
  {
    name: 'url',
    label: 'Adresse',
    type: 'text',
    admin: {
      condition: (_, sibling) => sibling?.type === 'url',
      description: 'Adresse complète (https://…) ou chemin du site (/contact).',
    },
  },
];
