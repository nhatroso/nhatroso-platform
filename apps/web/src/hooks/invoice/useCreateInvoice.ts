import * as React from 'react';
import { useTranslations } from 'next-intl';
import { roomsService } from '@/services/api/rooms';
import { invoicesService, InvoiceDetail } from '@/services/api/invoices';
import { Room } from '@nhatroso/shared';

interface UseInvoiceCreateOptions {
  onSuccess: () => void;
}

export function useCreateInvoice({ onSuccess }: UseInvoiceCreateOptions) {
  const t = useTranslations('Invoices');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = React.useState('');
  const [periodMonth, setPeriodMonth] = React.useState(
    new Date().toISOString().substring(0, 7), // Default to YYYY-MM
  );
  const [graceDays, setGraceDays] = React.useState(0);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [calculatedData, setCalculatedData] = React.useState<{
    room_code: string;
    tenant_name: string;
    details: { description: string; amount: string }[];
    total_amount: string;
  } | null>(null);

  React.useEffect(() => {
    roomsService.getAllRooms()
      .then((data) => {
        // Only show occupied rooms for calculation as they have contracts
        setRooms(data.filter((r) => r.status === 'OCCUPIED'));
      })
      .catch(console.error);
  }, []);

  const handleCalculate = async () => {
    if (!selectedRoomId || !periodMonth) return;
    setIsCalculating(true);
    setError(null);
    setCalculatedData(null);
    try {
      const data = await invoicesService.calculateInvoice(selectedRoomId, periodMonth);
      setCalculatedData(data);
    } catch (err: unknown) {
      console.error('Failed to calculate invoice', err);
      setError(
        t('calculationFailed', {
          defaultValue:
            'Failed to calculate. Ensure room has active contract & tenant.',
        }),
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!calculatedData) return;
    setIsLoading(true);
    try {
      await invoicesService.createInvoice({
        room_id: selectedRoomId,
        grace_days: graceDays,
        room_code: calculatedData.room_code,
        tenant_name: calculatedData.tenant_name,
        total_amount: calculatedData.total_amount,
        details: calculatedData.details as unknown as InvoiceDetail[],
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create invoice', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    periodMonth,
    setPeriodMonth,
    graceDays,
    setGraceDays,
    isLoading,
    isCalculating,
    error,
    calculatedData,
    handleCalculate,
    handleSubmit,
  };
}
