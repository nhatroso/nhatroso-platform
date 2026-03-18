import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room, CreateRoomInput } from '@nhatroso/shared';
import { getRooms, createRoom } from '@/services/api/rooms';

import { RoomPricingModal } from './RoomPricingModal';
import { priceRulesApi } from '@/services/api/price-rules';
import { servicesApi } from '@/services/api/services';

interface RoomListProps {
  floorId: string;
}

export function RoomList({ floorId }: RoomListProps) {
  const t = useTranslations('Buildings');
  const tErrors = useTranslations('Errors');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [prices, setPrices] = React.useState<Record<string, number>>({});
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

      // Fetch prices for all rooms
      const [allServices, ...allRules] = await Promise.all([
        servicesApi.list(),
        ...data.map((r) => priceRulesApi.listByRoom(r.id)),
      ]);

      const roomService = allServices.find(
        (s) =>
          s.name.toLowerCase().includes('phòng') ||
          s.name.toLowerCase().includes('room'),
      );

      if (roomService) {
        const newPrices: Record<string, number> = {};
        allRules.forEach((rules, idx) => {
          const activeRule = rules.find(
            (r) => r.service_id === roomService.id && !r.effective_end,
          );
          if (activeRule) {
            newPrices[data[idx].id] = Number(activeRule.unit_price);
          }
        });
        setPrices(newPrices);
      }
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
      <div className="flex w-full items-center justify-center py-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-teal-600" />
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'VACANT':
        return 'bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-500/20';
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-500/20';
      case 'DEPOSITED':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-500/20';
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-500/20';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-700/40 dark:text-gray-300 dark:ring-gray-500/20';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('Rooms')}
        </h5>
      </div>

      <div className="space-y-2">
        {rooms.length === 0 ? (
          <div className="rounded border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            {t('EmptyRooms')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {rooms.map((rm) => (
              <div
                key={rm.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded bg-white p-2.5 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:shadow-md dark:bg-gray-800 dark:ring-gray-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {rm.code}
                  </span>

                  <div className="flex flex-col items-end">
                    {prices[rm.id] ? (
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        {prices[rm.id].toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                        -
                      </span>
                    )}
                    <button
                      onClick={() => setManagingRoomPrice(rm)}
                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title={t('Pricing') || 'Pricing'}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-left">
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ring-1 ring-inset ${statusColor(rm.status)}`}>
                    {t(`Status_${rm.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {errorMsg && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder={t('PlaceholderRoomCode')}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating || !newCode.trim()}
            className="shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
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
