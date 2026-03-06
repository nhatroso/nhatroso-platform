import { z } from 'zod';

export const LoginSchema = z.object({
  phone: z.string().min(1, 'AUTH_PHONE_EMPTY'),
  password: z.string().min(8, 'AUTH_PASSWORD_TOO_SHORT'),
});

export const RegisterSchema = z.object({
  phone: z.string().min(1, 'AUTH_PHONE_EMPTY'),
  name: z.string().min(1, 'AUTH_NAME_EMPTY'),
  email: z.string().email('AUTH_INVALID_EMAIL').optional().or(z.literal('')),
  password: z.string().min(8, 'AUTH_PASSWORD_TOO_SHORT'),
});
