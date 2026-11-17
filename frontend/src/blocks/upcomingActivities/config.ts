import type { Block } from 'payload';

import { eyebrowField, textField, titleField } from '@/fields/common';

export const UpcomingActivitiesBlock: Block = {
  slug: 'upcomingActivities',
  labels: { singular: 'Prochaines activités', plural: 'Prochaines activités' },
  admin: { group: 'Activités' },
  fields: [
    eyebrowField,
    titleField(),
    textField,
    { name: 'limit', label: "Nombre d'activités", type: 'number', defaultValue: 6, min: 1, max: 12 },
  ],
};
