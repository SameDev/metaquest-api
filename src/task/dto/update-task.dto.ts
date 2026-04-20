import { z } from 'zod';

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['daily', 'weekly', 'one_time']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
