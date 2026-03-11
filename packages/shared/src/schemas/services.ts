import { z } from 'zod';

export const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1, 'Unit is required'),
});

export const UpdateServiceSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  unit: z.string().min(1, 'Unit cannot be empty').optional(),
});

export type CreateServiceParams = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceParams = z.infer<typeof UpdateServiceSchema>;
