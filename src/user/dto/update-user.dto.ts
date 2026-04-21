import { z } from 'zod';

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().max(2_000_000).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
}).refine(
  (d) => !(d.newPassword && !d.currentPassword),
  { message: 'currentPassword is required to change password', path: ['currentPassword'] },
);

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
