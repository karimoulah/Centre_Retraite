import type { Access } from 'payload';

/** Only the ADMIN role edits the site content (prompt: console CMS = ADMIN). */
export const adminOnly: Access = ({ req }) => !!(req.user as { roles?: string[] | null } | null)?.roles?.includes('ADMIN');
