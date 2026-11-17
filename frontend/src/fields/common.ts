import type { Field } from 'payload';

import { linkFields } from './link';

export const eyebrowField: Field = {
  name: 'eyebrow',
  label: 'Surtitre',
  type: 'text',
  admin: { description: 'Petit texte au-dessus du titre, par exemple « À propos du Centre ».' },
};

export const titleField = (required = true): Field => ({
  name: 'title',
  label: 'Titre',
  type: 'text',
  required,
});

export const textField: Field = { name: 'text', label: 'Texte', type: 'textarea' };

export const imageField = (name = 'image', label = 'Image'): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
});

/** Optional call-to-action button. */
export const actionField = (name = 'action', label = 'Bouton'): Field => ({
  name,
  label,
  type: 'group',
  admin: { description: 'Laissez le libellé vide pour ne pas afficher de bouton.' },
  fields: linkFields().map((field) =>
    'name' in field && field.name === 'label' ? { ...field, required: false } : field,
  ),
});

export const themeField: Field = {
  name: 'theme',
  label: 'Fond',
  type: 'select',
  defaultValue: 'light',
  options: [
    { label: 'Clair', value: 'light' },
    { label: 'Sombre (suit le héros)', value: 'dark' },
  ],
};
