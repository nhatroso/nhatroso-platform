import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room, CreateRoomInput } from '@nhatroso/shared';
import { getRooms, createRoom } from '@/services/api/buildings';

interface RoomListProps {
  floorId: string;
}

export function RoomList({ floorId }: RoomListProps) {
  const t = useTranslations('Buildings');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');

  React.useEffect(() => {
    fetchRooms();
  }, [floorId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await getRooms(floorId);
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    try {
      setIsCreating(true);
      const payload: CreateRoomInput = { code: newCode };
      await createRoom(floorId, payload);
      setNewCode('');
      fetchRooms();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          {t('LoadingRooms')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 bg-zinc-100 p-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">
          {t('Rooms')}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-zinc-50">
        {rooms.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
            {t('EmptyRooms')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {rooms.map((rm) => (
              <div
                key={rm.id}
                className="flex flex-col items-start justify-between border-2 border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-900"
              >
                <span className="font-black text-lg text-zinc-900">
                  {rm.code}
                </span>
                <span
                  className={`mt-2 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                    rm.status === 'VACANT'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {t(`Status_${rm.status}`)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 bg-zinc-50 p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder={t('PlaceholderRoomCode')}
            className="w-full rounded-none border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-0"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating || !newCode.trim()}
            className="w-full rounded-none bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-transform hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {t('AddRoom')}
          </button>
        </form>
      </div>
    </div>
  );
}
