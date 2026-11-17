import type { CollectionConfig } from 'payload';

import { revalidateSite } from '@/lib/cms/revalidate';

export const Activities: CollectionConfig = {
  slug: 'activities',
  labels: { singular: 'Activité', plural: 'Activités' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'startsAt', 'location', 'published'], group: 'Site' },
  access: { read: ({ req }) => (req.user ? true : { published: { equals: true } }) },
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateSite] },
  defaultSort: 'startsAt',
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    {
      name: 'startsAt',
      label: 'Début',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' } },
    },
    { name: 'location', label: 'Lieu', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'published', label: 'Affichée sur le site', type: 'checkbox', defaultValue: true },
  ],
};
