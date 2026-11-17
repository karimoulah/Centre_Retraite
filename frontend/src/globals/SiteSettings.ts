import type { GlobalConfig } from 'payload';

import { revalidateSite } from '@/lib/cms/revalidate';

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Coordonnées et réglages du site',
  admin: { group: 'Site' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateSite] },
  fields: [
    { name: 'phone', label: 'Téléphone', type: 'text', required: true, admin: { description: 'Format affiché, par exemple (514) 555-0100.' } },
    { name: 'email', label: 'Courriel', type: 'email', required: true },
    { name: 'address', label: 'Adresse', type: 'textarea', required: true },
    { name: 'openingHours', label: "Heures d'ouverture", type: 'text' },
    { name: 'footerText', label: 'Texte du pied de page', type: 'textarea' },
    {
      name: 'socials',
      label: 'Réseaux sociaux',
      type: 'array',
      fields: [
        {
          name: 'platform',
          label: 'Réseau',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X', value: 'x' },
          ],
        },
        { name: 'url', label: 'Adresse', type: 'text', required: true },
      ],
    },
  ],
};
