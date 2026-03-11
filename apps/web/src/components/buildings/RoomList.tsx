import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room, CreateRoomInput } from '@nhatroso/shared';
import { getRooms, createRoom } from '@/services/api/buildings';
import { RoomPricingModal } from './RoomPricingModal';

interface RoomListProps {
  floorId: string;
}

export function RoomList({ floorId }: RoomListProps) {
  const t = useTranslations('Buildings');
  const tErrors = useTranslations('Errors');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [managingRoomPrice, setManagingRoomPrice] = React.useState<Room | null>(
    null,
  );

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
      console.error(err);
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
        // Try to translate the error code, fallback to message
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
                className="group flex flex-col items-start justify-between border-2 border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-900"
              >
                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setManagingRoomPrice(rm)}
                    className="p-2 text-zinc-400 hover:text-zinc-900"
                    title={t('Pricing') || 'Pricing'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </button>
                  {/* Future actions like Edit / Delete can go here */}
                  <div className="p-2 text-zinc-300">⚙</div>
                </div>
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
        {errorMsg && (
          <div className="mb-2 bg-red-50 p-2 text-xs font-bold text-red-600 border-l-4 border-red-600">
            {errorMsg}
          </div>
        )}
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

      {managingRoomPrice && (
        <RoomPricingModal
          room={managingRoomPrice}
          onClose={() => setManagingRoomPrice(null)}
        />
      )}
    </div>
  );
}
