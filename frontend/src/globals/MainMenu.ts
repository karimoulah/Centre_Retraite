import type { GlobalConfig } from 'payload';

import { linkFields } from '@/fields/link';
import { adminOnly } from '@/lib/cms/access';
import { revalidateSite } from '@/lib/cms/revalidate';

export const MainMenu: GlobalConfig = {
  slug: 'mainMenu',
  label: 'Menu principal',
  admin: {
    group: 'Site',
    description:
      "Liens de l'en-tête, dans l'ordre d'affichage. Un lien avec un sous-menu s'ouvre en liste déroulante ; pour viser une section d'une page, ajoutez son ancre à l'adresse (ex. /qui-sommes-nous#vision).",
  },
  access: { read: () => true, update: adminOnly },
  hooks: { afterChange: [revalidateSite] },
  fields: [
    {
      name: 'items',
      label: 'Liens',
      type: 'array',
      maxRows: 7,
      fields: [
        ...linkFields(),
        {
          name: 'children',
          label: 'Sous-menu (facultatif)',
          type: 'array',
          maxRows: 6,
          fields: linkFields(),
        },
      ],
    },
  ],
};
