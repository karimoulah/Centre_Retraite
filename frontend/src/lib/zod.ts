import { z } from 'zod';

// French fallback messages for any rule without a custom message.
z.config(z.locales.fr());

/** Common field rules, with messages written for the Centre's users. */
export const fields = {
  email: () =>
    z.string().trim().min(1, 'Entrez votre adresse courriel.').email('Entrez une adresse courriel valide, par exemple nom@exemple.com.'),
  requiredText: (label: string, max = 200) =>
    z.string().trim().min(1, `${label} est obligatoire.`).max(max, `${label} : ${max} caractères au maximum.`),
  optionalText: (max = 500) => z.string().trim().max(max, `${max} caractères au maximum.`).optional().or(z.literal('')),
  password: () => z.string().min(1, 'Entrez votre mot de passe.'),
  /** New password rules, also displayed next to the field. */
  newPassword: () =>
    z
      .string()
      .min(12, 'Au moins 12 caractères.')
      .regex(/[A-Z]/, 'Au moins une lettre majuscule.')
      .regex(/[a-z]/, 'Au moins une lettre minuscule.')
      .regex(/[0-9]/, 'Au moins un chiffre.'),
};

export const PASSWORD_RULES = [
  'Au moins 12 caractères',
  'Au moins une lettre majuscule et une minuscule',
  'Au moins un chiffre',
];

export { z };
