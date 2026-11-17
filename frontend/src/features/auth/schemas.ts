import { fields, z } from '@/lib/zod';

export const loginSchema = z.object({
  email: fields.email(),
  password: fields.password(),
});

export type LoginValues = z.infer<typeof loginSchema>;
