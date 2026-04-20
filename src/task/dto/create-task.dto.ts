import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['daily', 'weekly', 'one_time']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
