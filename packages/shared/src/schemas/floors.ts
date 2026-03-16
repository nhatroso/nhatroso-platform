import { z } from 'zod';

export const createFloorSchema = z.object({
  identifier: z.string().min(1, 'errors.floors.identifierRequired'),
});

export const updateFloorSchema = z.object({
  identifier: z.string().min(1, 'errors.floors.identifierRequired').optional(),
});

export type CreateFloorInput = z.infer<typeof createFloorSchema>;
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;
