import type { GlobalConfig } from 'payload';

import { adminOnly } from '@/lib/cms/access';

import { linkFields } from '@/fields/link';
import { revalidateSite } from '@/lib/cms/revalidate';

export const FooterMenus: GlobalConfig = {
  slug: 'footerMenus',
  label: 'Menus du pied de page',
  admin: { group: 'Site' },
  access: { read: () => true, update: adminOnly },
  hooks: { afterChange: [revalidateSite] },
  fields: [
    {
      name: 'columns',
      label: 'Colonnes',
      type: 'array',
      maxRows: 4,
      fields: [
        { name: 'title', label: 'Titre', type: 'text', required: true },
        { name: 'links', label: 'Liens', type: 'array', fields: linkFields() },
      ],
    },
  ],
};
