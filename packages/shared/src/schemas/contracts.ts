import { z } from 'zod';

export const CreateContractSchema = z.object({
  room_id: z.string().uuid(),
  owner_name: z.string().min(1, 'Landlord name is required'),
  owner_id_card: z.string().min(1, 'Landlord ID Card number is required'),
  owner_id_card_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  owner_address: z.string().min(1, 'Landlord Address is required'),
  owner_phone: z.string().min(1, 'Landlord Phone number is required'),
  tenant_name: z.string().min(1, 'Tenant name is required'),
  tenant_id_card: z.string().min(1, 'ID Card number is required'),
  tenant_id_card_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  tenant_address: z.string().min(1, 'Address is required'),
  tenant_phone: z.string().min(1, 'Phone number is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  monthly_rent: z.number().int().positive('Must be a positive integer'),
  deposit_amount: z
    .number()
    .int()
    .nonnegative('Must be zero or positive integer'),
  payment_day: z.number().int().min(1).max(28),
  rental_period: z.number().int().positive('Rental period must be positive'),
  room_code: z.string().min(1, 'Room code is required'),
  room_address: z.string().min(1, 'Room address is required'),
});

export type CreateContractParams = z.infer<typeof CreateContractSchema>;

export const ContractSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  room_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  monthly_rent: z.number(),
  deposit_amount: z.number(),
  payment_day: z.number(),
  rental_period: z.number(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),

  // Joined fields for display in frontend
  owner_name: z.string().optional(),
  owner_id_card: z.string().optional().nullable(),
  owner_id_card_date: z.string().optional().nullable(),
  owner_address: z.string().optional().nullable(),
  owner_phone: z.string().optional(),

  tenant_name: z.string().optional(),
  tenant_id_card: z.string().optional().nullable(),
  tenant_id_card_date: z.string().optional().nullable(),
  tenant_address: z.string().optional().nullable(),
  tenant_phone: z.string().optional(),

  room: z.any().optional(), // For joining room details
  room_address: z.string().optional(),
  room_code: z.string().optional(),
});

export type ContractResponse = z.infer<typeof ContractSchema>;
