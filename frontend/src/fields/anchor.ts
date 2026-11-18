import type { Block, Field } from 'payload';

/** Optional anchor on every page section, so a menu link can point to it (/page#vision). */
export const anchorField: Field = {
  name: 'anchor',
  label: 'Ancre (facultatif)',
  type: 'text',
  admin: {
    position: 'sidebar',
    description: 'Mot sans espace ni accent, ex. « vision ». Le lien /page#vision ouvre la page sur cette section.',
  },
  validate: (value: unknown) =>
    !value || /^[a-z0-9-]+$/.test(String(value)) || 'Lettres minuscules sans accent, chiffres et tirets seulement.',
};

export const withAnchor = (block: Block): Block => ({ ...block, fields: [...block.fields, anchorField] });
