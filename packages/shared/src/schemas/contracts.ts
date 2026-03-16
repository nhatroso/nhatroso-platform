import { z } from 'zod';

export const createContractSchema = z.object({
  room_id: z.string().uuid('errors.contracts.invalidRoomId'),
  start_date: z.string().min(1, 'errors.contracts.startDateRequired'),
  end_date: z.string().min(1, 'errors.contracts.endDateRequired'),
  payment_cycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  deposit_amount: z.number().min(0, 'DEPOSIT_AMOUNT_INVALID'),
  monthly_rent: z.number().min(0, 'MONTHLY_RENT_INVALID'),

  // Landlord details (Party A)
  landlord_name: z.string().min(1, 'LANDLORD_NAME_REQUIRED'),
  landlord_id_card: z.string().min(1, 'LANDLORD_ID_CARD_REQUIRED'),
  landlord_id_date: z.string().min(1, 'LANDLORD_ID_DATE_REQUIRED'),
  landlord_address: z.string().min(1, 'LANDLORD_ADDRESS_REQUIRED'),
  landlord_phone: z.string().min(1, 'LANDLORD_PHONE_REQUIRED'),

  // Tenant details (Party B)
  tenant_name: z.string().min(1, 'TENANT_NAME_REQUIRED'),
  tenant_id_card: z.string().min(1, 'TENANT_ID_CARD_REQUIRED'),
  tenant_id_date: z.string().min(1, 'TENANT_ID_DATE_REQUIRED'),
  tenant_address: z.string().min(1, 'TENANT_ADDRESS_REQUIRED'),
  tenant_phone: z.string().min(1, 'PHONE_REQUIRED'),
});

export const endContractSchema = z.object({
  end_date: z.string().min(1, 'errors.contracts.endDateRequired'),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type EndContractInput = z.infer<typeof endContractSchema>;
