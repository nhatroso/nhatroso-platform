import { z } from 'zod';
import { LoginSchema, RegisterSchema } from '../schemas/auth';

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

export interface AuthResponse {
  token: String;
  refresh_token: String;
  id: String;
}
