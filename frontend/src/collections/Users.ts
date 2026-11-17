import type { CollectionConfig } from 'payload';

import { ROLE_LABELS, ROLES } from '@/lib/api/contracts';
import { nestJwtStrategy } from '@/lib/cms/nest-auth-strategy';

const isAdmin = ({ req }: { req: { user?: { roles?: string[] | null } | null } }) => !!req.user?.roles?.includes('ADMIN');

/**
 * Mirror of the NestJS accounts that open the CMS. No password here:
 * the console trusts the API's session cookie (see nest-auth-strategy.ts).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utilisateur', plural: 'Utilisateurs' },
  admin: { useAsTitle: 'email', group: 'Administration', description: 'Créés automatiquement à la première visite ; gérez les comptes dans le back-office.' },
  auth: { disableLocalStrategy: true, strategies: [nestJwtStrategy] },
  access: {
    admin: isAdmin,
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'email', label: 'Courriel', type: 'email', required: true, unique: true, admin: { readOnly: true } },
    { name: 'name', label: 'Nom', type: 'text', admin: { readOnly: true } },
    { name: 'apiUserId', label: "Identifiant dans l'API", type: 'text', admin: { readOnly: true } },
    {
      name: 'roles',
      label: 'Rôles',
      type: 'select',
      hasMany: true,
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      admin: { readOnly: true },
    },
  ],
};
