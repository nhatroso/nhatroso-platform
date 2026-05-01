import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateContractSchema,
  CreateContractParams,
  Room,
} from '@nhatroso/shared';
import { contractsService } from '@/services/api/contracts';
import { roomsService } from '@/services/api/rooms';
import { usersService } from '@/services/api/users';

export function useCreateContract() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMSG, setErrorMSG] = React.useState('');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = React.useState(true);

  // Profile Lookup States
  const [isLookingUp, setIsLookingUp] = React.useState(false);
  const [userExists, setUserExists] = React.useState(false);
  const [hasActiveContract, setHasActiveContract] = React.useState(false);
  const [foundUser, setFoundUser] = React.useState<{
    name: string;
    phone: string;
    id_card?: string;
    address?: string;
    id_card_date?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateContractParams>({
    resolver: zodResolver(CreateContractSchema),
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
      monthly_rent: 0,
      deposit_amount: 0,
      payment_day: 5,
      rental_period: 12,
    },
  });

  React.useEffect(() => {
    roomsService
      .getAvailableRooms()
      .then(setRooms)
      .catch((err) => {
        console.error('Failed to load available rooms:', err);
        setErrorMSG('Không thể tải danh sách phòng trống');
      })
      .finally(() => setIsLoadingRooms(false));

    // Auto-fill landlord info
    usersService
      .getCurrentUser()
      .then((user) => {
        if (user) {
          setValue('owner_name', user.name || '');
          setValue('owner_phone', user.phone || '');
          setValue('owner_id_card', user.id_card || '');
          setValue('owner_id_card_date', user.id_card_date || '');
          setValue('owner_address', user.address || '');
        }
      })
      .catch((err) => {
        console.warn('Failed to pre-fill landlord info:', err);
      });
  }, [setValue]);

  const watchPhone = useWatch({ control, name: 'tenant_phone' });

  React.useEffect(() => {
    if (!watchPhone || watchPhone.trim().length < 8) {
      setUserExists(false);
      setHasActiveContract(false);
      setFoundUser(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const res = await usersService.lookupByPhone(watchPhone);
        setUserExists(res.exists);
        setHasActiveContract(res.has_active_contract);
        if (res.exists && res.user) {
          setFoundUser({
            name: res.user.name,
            phone: res.user.phone,
            id_card: res.user.id_card,
            address: res.user.address,
            id_card_date: res.user.id_card_date,
          });
          setValue('tenant_name', res.user.name || '', {
            shouldValidate: true,
          });
          setValue('tenant_phone', res.user.phone || '', {
            shouldValidate: true,
          });
          setValue('tenant_id_card', res.user.id_card || '', {
            shouldValidate: true,
          });
          setValue('tenant_address', res.user.address || '', {
            shouldValidate: true,
          });
          if (res.user.id_card_date) {
            const dateStr = res.user.id_card_date.split('T')[0];
            setValue('tenant_id_card_date', dateStr, { shouldValidate: true });
          }
        } else {
          setUserExists(false);
          setFoundUser(null);
          setValue('tenant_name', '');
          setValue('tenant_id_card', '');
          setValue('tenant_id_card_date', '');
          setValue('tenant_address', '');
        }
      } catch (e) {
        console.warn('Lookup error', e);
      } finally {
        setIsLookingUp(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [watchPhone, setValue]);

  const watchRoomId = watch('room_id');

  React.useEffect(() => {
    if (watchRoomId) {
      const selectedRoom = rooms.find((r) => r.id === watchRoomId);
      if (selectedRoom) {
        setValue('room_code', selectedRoom.code, { shouldValidate: true });
        setValue('room_address', selectedRoom.room_address || '', {
          shouldValidate: true,
        });
      } else {
        setValue('room_code', '', { shouldValidate: true });
        setValue('room_address', '', { shouldValidate: true });
      }
    }
  }, [watchRoomId, rooms, setValue]);

  const watchStartDate = watch('start_date');
  const watchRentalPeriod = watch('rental_period');

  React.useEffect(() => {
    if (watchStartDate && watchRentalPeriod) {
      const start = new Date(watchStartDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        end.setMonth(start.getMonth() + watchRentalPeriod);
        const yyyy = end.getFullYear();
        const mm = String(end.getMonth() + 1).padStart(2, '0');
        const dd = String(end.getDate()).padStart(2, '0');
        const endDateStr = `${yyyy}-${mm}-${dd}`;
        setValue('end_date', endDateStr, { shouldValidate: true });
      }
    }
  }, [watchStartDate, watchRentalPeriod, setValue]);

  const onSubmit = async (data: CreateContractParams) => {
    setIsSubmitting(true);
    setErrorMSG('');
    try {
      const contract = await contractsService.create(data);
      router.push(`/dashboard/contracts/${contract.id}`);
    } catch (error: unknown) {
      const err = error as Error;
      setErrorMSG(err?.message || 'Failed to create contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    rooms,
    isLoadingRooms,
    isSubmitting,
    errorMSG,
    isLookingUp,
    userExists,
    hasActiveContract,
    foundUser,
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    watch,
    control,
    setValue,
    router,
  };
}
