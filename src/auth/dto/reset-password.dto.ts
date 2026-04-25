import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
