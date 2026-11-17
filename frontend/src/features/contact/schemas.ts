import { fields, z } from '@/lib/zod';

export const CONTACT_SUBJECTS = [
  { value: 'info', label: 'Renseignements généraux' },
  { value: 'membership', label: 'Adhésion' },
  { value: 'activities', label: 'Activités' },
  { value: 'volunteering', label: 'Bénévolat' },
  { value: 'other', label: 'Autre' },
] as const;

export const contactSchema = z.object({
  name: fields.requiredText('Votre nom', 120),
  email: fields.email(),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s().+-]*$/, 'Entrez un numéro de téléphone valide, par exemple 514 555-0100.')
    .max(30)
    .optional()
    .or(z.literal('')),
  subject: z.enum(CONTACT_SUBJECTS.map((s) => s.value) as [string, ...string[]], { message: 'Choisissez un sujet.' }),
  message: z.string().trim().min(10, 'Votre message doit contenir au moins 10 caractères.').max(3000, '3 000 caractères au maximum.'),
});

export type ContactValues = z.infer<typeof contactSchema>;
