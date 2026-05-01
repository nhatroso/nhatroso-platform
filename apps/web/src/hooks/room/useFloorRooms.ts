import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room, CreateRoomInput } from '@nhatroso/shared';
import { roomsService } from '@/services/api/rooms';

export function useFloorRooms(floorId: string) {
  const tErrors = useTranslations('Errors');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const fetchRooms = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomsService.getRooms(floorId);
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }, [floorId]);

  React.useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setErrorMsg('');
    try {
      setIsCreating(true);
      const payload: CreateRoomInput = { code: newCode };
      await roomsService.createRoom(floorId, payload);
      setNewCode('');
      await fetchRooms();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        const translatedErr = tErrors(err.message) || err.message;
        setErrorMsg(translatedErr);
      } else {
        setErrorMsg('Failed to create room');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return {
    rooms,
    loading,
    isCreating,
    newCode,
    setNewCode,
    errorMsg,
    handleCreate,
    refresh: fetchRooms,
  };
}
