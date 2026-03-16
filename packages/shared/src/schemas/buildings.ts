import { z } from 'zod';

export const createBuildingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
});

export const updateBuildingSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  address: z.string().optional(),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
