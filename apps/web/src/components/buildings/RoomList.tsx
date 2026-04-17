import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room, CreateRoomInput } from '@nhatroso/shared';
import { getRooms, createRoom } from '@/services/api/rooms';
import { RoomCard } from './RoomCard';

export function RoomList({ floorId }: { floorId: string }) {
  const t = useTranslations('Buildings');
  const tErrors = useTranslations('Errors');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await getRooms(floorId);
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setErrorMsg('');
    try {
      setIsCreating(true);
      const payload: CreateRoomInput = { code: newCode };
      await createRoom(floorId, payload);
      setNewCode('');
      fetchRooms();
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

  if (loading) {
    return (
      <div
        className="flex w-full items-center justify-center py-4"
        role="progressbar"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-subtle border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-tiny font-semibold uppercase tracking-wider text-gray-muted">
          {t('Rooms')}
        </h5>
      </div>

      <div className="space-y-2">
        {rooms.length === 0 ? (
          <div className="rounded border border-dashed border-gray-border p-4 text-center text-tiny text-gray-muted">
            {t('EmptyRooms')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {rooms.map((rm) => (
              <RoomCard key={rm.id} room={rm} compact />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray-border bg-gray-card p-4 shadow-sm">
        {errorMsg && (
          <div className="mb-3 rounded-lg bg-danger-light p-3 text-body text-danger dark:bg-danger-dark/10 dark:text-danger-dark">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder={t('PlaceholderRoomCode')}
            className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating || !newCode.trim()}
            className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50 dark:bg-primary dark:hover:bg-primary-hover transition-colors"
          >
            {t('AddRoom')}
          </button>
        </form>
      </div>
    </div>
  );
}
