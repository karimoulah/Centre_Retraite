import type { GlobalConfig } from 'payload';

import { linkFields } from '@/fields/link';
import { revalidateSite } from '@/lib/cms/revalidate';

export const MainMenu: GlobalConfig = {
  slug: 'mainMenu',
  label: 'Menu principal',
  admin: { group: 'Site', description: "Liens de l'en-tête, dans l'ordre d'affichage." },
  access: { read: () => true },
  hooks: { afterChange: [revalidateSite] },
  fields: [
    {
      name: 'items',
      label: 'Liens',
      type: 'array',
      maxRows: 7,
      fields: linkFields(),
    },
  ],
};
