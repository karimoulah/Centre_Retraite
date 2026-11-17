import { fields, z } from '@/lib/zod';

export const loginSchema = z.object({
  email: fields.email(),
  password: fields.password(),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: fields.email() });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: fields.newPassword(), confirmation: z.string().min(1, 'Confirmez le mot de passe.') })
  .refine((v) => v.password === v.confirmation, { path: ['confirmation'], message: 'Les deux mots de passe ne sont pas identiques.' });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
