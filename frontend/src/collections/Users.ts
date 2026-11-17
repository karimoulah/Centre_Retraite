import type { CollectionConfig } from 'payload';

// Temporary local login so /admin works during setup.
// F0-04 replaces it with a strategy that verifies the NestJS JWT (disableLocalStrategy).
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email' },
  auth: true,
  fields: [],
};
