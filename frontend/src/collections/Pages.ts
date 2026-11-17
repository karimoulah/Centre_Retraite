import type { CollectionConfig } from 'payload';

import { adminOnly } from '@/lib/cms/access';

import { pageBlocks } from '@/blocks';
import { revalidateSite } from '@/lib/cms/revalidate';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Site',
    // "Aperçu" button: opens the draft on the public site, with a banner.
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5173'}/preview?slug=${encodeURIComponent(String(doc.slug ?? ''))}`,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  // Visitors only see published pages; signed-in editors also see drafts.
  access: { create: adminOnly, update: adminOnly, delete: adminOnly, read: ({ req }) => (req.user?.roles?.includes('ADMIN') ? true : { _status: { equals: 'published' } }) },
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateSite] },
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
    { name: 'layout', label: 'Sections', type: 'blocks', blocks: pageBlocks },
    {
      name: 'meta',
      label: 'Référencement (SEO)',
      type: 'group',
      fields: [
        { name: 'title', label: 'Titre affiché dans Google', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea', maxLength: 160 },
        { name: 'image', label: 'Image de partage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
};
