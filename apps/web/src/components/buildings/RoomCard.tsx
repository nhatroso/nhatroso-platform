import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room } from '@nhatroso/shared';
import { Activity, Plus } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  buildingName?: string;
  floorName?: string;
  onManagePrice: (room: Room) => void;
  onManageMeters: (room: Room) => void;
  compact?: boolean;
}

export function RoomCard({
  room,
  buildingName,
  floorName,
  onManagePrice,
  onManageMeters,
  compact = false,
}: RoomCardProps) {
  const t = useTranslations('Buildings');

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

  if (compact) {
    return (
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {room.code}
          </h3>
          {room.status === 'OCCUPIED' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onManagePrice(room)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-400 opacity-0 transition-all hover:bg-blue-50 hover:text-blue-600 focus:opacity-100 group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                title={t('Pricing')}
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => onManageMeters(room)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-400 opacity-0 transition-all hover:bg-teal-50 hover:text-teal-600 focus:opacity-100 group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-teal-900/30 dark:hover:text-teal-400"
                title={t('MeterReading')}
              >
                <Activity size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusColor(room.status)}`}
          >
            {t(`Status_${room.status}`)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-gray-200 transition-all hover:shadow-lg dark:bg-gray-800 dark:ring-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {room.code}
          </h3>
          <span
            className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusColor(room.status)}`}
          >
            {t(`Status_${room.status}`)}
          </span>
        </div>
        {room.status === 'OCCUPIED' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onManagePrice(room)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all hover:bg-blue-100 hover:scale-105 active:scale-95 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              title={t('Pricing')}
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => onManageMeters(room)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all hover:bg-teal-100 hover:scale-105 active:scale-95 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/30"
              title={t('MeterReading')}
            >
              <Activity size={18} />
            </button>
          </div>
        )}
      </div>

      {(buildingName || floorName) && (
        <div className="mt-auto space-y-1 pt-2 border-t border-gray-50 dark:border-gray-700/50">
          {buildingName && (
            <p
              className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1"
              title={buildingName}
            >
              <span className="font-medium">{t('Building')}:</span>{' '}
              {buildingName}
            </p>
          )}
          {floorName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              <span className="font-medium">{t('Floor')}:</span> {floorName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
