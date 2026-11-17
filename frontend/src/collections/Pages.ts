import type { CollectionConfig } from 'payload';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'updatedAt'], group: 'Site' },
  access: { read: () => true },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Adresse de la page',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: '« home » pour la page d’accueil ; sinon, par exemple « a-propos ».' },
    },
  ],
};
