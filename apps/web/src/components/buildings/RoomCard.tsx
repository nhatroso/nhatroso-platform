'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room } from '@nhatroso/shared';
import { Card, Badge } from 'flowbite-react';
import { Icons } from '@/components/icons';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VACANT':
        return 'success';
      case 'OCCUPIED':
        return 'info';
      case 'DEPOSITED':
        return 'warning';
      case 'MAINTENANCE':
        return 'failure';
      default:
        return 'gray';
    }
  };

  if (compact) {
    return (
      <Card className="h-full">
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {room.code}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <Badge color={getStatusColor(room.status)} size="xs">
              {t(`Status_${room.status}`)}
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {room.code}
          </h3>
          <div className="mt-2">
            <Badge color={getStatusColor(room.status)} size="sm">
              {t(`Status_${room.status}`)}
            </Badge>
          </div>
        </div>
      </div>

      {(buildingName || floorName) && (
        <div className="mt-auto space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {buildingName && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Icons.Building className="mr-1 h-3 w-3" />
              <span className="font-medium mr-1">{t('Building')}:</span>
              <span className="truncate" title={buildingName}>
                {buildingName}
              </span>
            </div>
          )}
          {floorName && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Icons.Floor className="mr-1 h-3 w-3" />
              <span className="font-medium mr-1">{t('Floor')}:</span>
              <span className="truncate">{floorName}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
