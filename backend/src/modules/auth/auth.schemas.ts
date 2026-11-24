import { createZodDto } from 'nestjs-zod';

import { z } from '../../common/zod';

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
});
export class LoginDto extends createZodDto(loginSchema) {}
