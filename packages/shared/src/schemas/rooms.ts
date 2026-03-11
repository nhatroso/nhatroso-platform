import { z } from 'zod';

export const createRoomSchema = z.object({
  code: z.string().min(1, 'errors.rooms.codeRequired'),
});

export const updateRoomSchema = z.object({
  code: z.string().min(1, 'errors.rooms.codeRequired').optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
