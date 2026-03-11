import { z } from 'zod';

export const createBlockSchema = z.object({
  identifier: z.string().min(1, 'errors.blocks.identifierRequired'),
});

export const updateBlockSchema = z.object({
  identifier: z.string().min(1, 'errors.blocks.identifierRequired').optional(),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
