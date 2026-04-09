import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room } from '@nhatroso/shared';

interface RoomCardProps {
  room: Room;
  buildingName?: string;
  floorName?: string;
  compact?: boolean;
}

export function RoomCard({
  room,
  buildingName,
  floorName,
  compact = false,
}: RoomCardProps) {
  const t = useTranslations('Buildings');

  const statusColor = (status: string) => {
    switch (status) {
      case 'VACANT':
        return 'bg-success-light text-success ring-success/20 dark:bg-success-dark/20 dark:text-success-dark';
      case 'OCCUPIED':
        return 'bg-primary-light text-primary ring-primary/20 dark:bg-primary-dark/20 dark:text-primary-dark';
      case 'DEPOSITED':
        return 'bg-warning-light text-warning ring-warning/20 dark:bg-warning-dark/20 dark:text-warning-dark';
      case 'MAINTENANCE':
        return 'bg-danger-light text-danger ring-danger/20 dark:bg-danger-dark/20 dark:text-danger-dark';
      default:
        return 'bg-gray-subtle text-gray-text ring-gray-border';
    }
  };

  if (compact) {
    return (
      <div className="group relative flex h-20 flex-col justify-between overflow-hidden rounded-xl bg-gray-card p-3 shadow-sm border border-gray-border transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-body font-bold text-gray-text">{room.code}</h3>
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-tiny font-semibold ring-1 ring-inset ${statusColor(room.status)}`}
          >
            {t(`Status_${room.status}`)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-gray-card p-5 shadow-sm border border-gray-border transition-all hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-h3 font-bold text-gray-text">{room.code}</h3>
          <span
            className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-tiny font-semibold ring-1 ring-inset ${statusColor(room.status)}`}
          >
            {t(`Status_${room.status}`)}
          </span>
        </div>
      </div>

      {(buildingName || floorName) && (
        <div className="mt-auto space-y-1 pt-2 border-t border-gray-border">
          {buildingName && (
            <p
              className="text-tiny text-gray-muted line-clamp-1"
              title={buildingName}
            >
              <span className="font-medium">{t('Building')}:</span>{' '}
              {buildingName}
            </p>
          )}
          {floorName && (
            <p className="text-tiny text-gray-muted line-clamp-1">
              <span className="font-medium">{t('Floor')}:</span> {floorName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
