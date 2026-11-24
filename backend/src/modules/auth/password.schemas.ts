import { createZodDto } from 'nestjs-zod';

import { z } from '../../common/zod';

/** Same rules as the frontend (shown live while typing). */
export const newPassword = () =>
  z
    .string()
    .min(12, 'Au moins 12 caractères.')
    .max(200)
    .regex(/[A-Z]/, 'Au moins une lettre majuscule.')
    .regex(/[a-z]/, 'Au moins une lettre minuscule.')
    .regex(/[0-9]/, 'Au moins un chiffre.');

export class ForgotPasswordDto extends createZodDto(z.object({ email: z.email().trim().toLowerCase() })) {}
export class ResetPasswordDto extends createZodDto(z.object({ token: z.string().min(10).max(200), password: newPassword() })) {}
