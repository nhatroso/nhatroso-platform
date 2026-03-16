import { z } from 'zod';

export const CreatePriceRuleSchema = z.object({
  service_id: z.string().uuid(),
  // Can be number or generic input coercible to number for decimal
  unit_price: z
    .union([z.number(), z.string().transform(Number)])
    .refine((n) => n > 0, {
      message: 'Unit price must be positive',
    }),
  effective_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export const UpdatePriceRuleSchema = z.object({
  unit_price: z
    .union([z.number(), z.string().transform(Number)])
    .refine((n) => n > 0, {
      message: 'Unit price must be positive',
    })
    .optional(),
  effective_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
});

export type CreatePriceRuleParams = z.infer<typeof CreatePriceRuleSchema>;
export type UpdatePriceRuleParams = z.infer<typeof UpdatePriceRuleSchema>;
