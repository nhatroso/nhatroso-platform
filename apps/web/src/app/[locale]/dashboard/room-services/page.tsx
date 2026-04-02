'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRoomServicesDashboard } from '@/hooks/use-room-services-dashboard';
import { Room } from '@nhatroso/shared';
import { RoomPricingModal } from '@/components/buildings/RoomPricingModal';
import { MeterManagementModal } from '@/components/buildings/MeterManagementModal';
import { Settings2, Activity, Home, Zap, Droplets } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

function RoomCardSkeleton() {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="mb-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="mt-1.5 h-3 w-16" />
        <Skeleton className="mt-2 h-2 w-24" />
      </div>
      <div className="mb-3 space-y-2 border-t border-gray-50 pt-2 dark:border-gray-700">
        <div className="flex justify-between">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-2 w-10" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-2 w-10" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 flex-1 rounded-lg" />
        <Skeleton className="h-7 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'VACANT':
      return {
        badge:
          'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
      };
    case 'OCCUPIED':
      return {
        badge:
          'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
      };
    case 'DEPOSITED':
      return {
        badge:
          'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
      };
    case 'MAINTENANCE':
      return {
        badge:
          'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400',
      };
    default:
      return {
        badge:
          'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-400',
      };
  }
}

function RoomServicesContent() {
  const t = useTranslations('Buildings');
  const tRS = useTranslations('RoomServices');

  const {
    buildings,
    floors,
    roomMeters,
    availableFloors,
    filteredRooms,
    loading,
    selectedBuildingId,
    selectedFloorId,
    selectedStatus,
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedStatus,
    refresh,
  } = useRoomServicesDashboard();

  const [managingRoomPrice, setManagingRoomPrice] = React.useState<Room | null>(
    null,
  );
  const [managingRoomMeters, setManagingRoomMeters] =
    React.useState<Room | null>(null);

  const handlePriceModalClose = () => {
    setManagingRoomPrice(null);
    refresh();
  };

  const handleMeterModalClose = () => {
    setManagingRoomMeters(null);
    refresh();
  };

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {tRS('Title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {tRS('Description')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Building filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('Building')}:
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setSelectedFloorId('all');
              }}
              className="block w-48 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="all">-- {t('AllBuildings')} --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Floor filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('Floor')}:
            </label>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              disabled={availableFloors.length === 0}
              className="block w-48 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="all">-- {t('AllFloors')} --</option>
              {availableFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.identifier}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('Status')}:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-40 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="all">-- {t('AllStatus')} --</option>
              <option value="OCCUPIED">{t('Status_OCCUPIED')}</option>
              <option value="VACANT">{t('Status_VACANT')}</option>
            </select>
          </div>

          <span className="ml-auto text-xs text-gray-400">
            {tRS('RoomsCount', { count: filteredRooms.length })}
          </span>
        </div>
      </div>

      {/* Room Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <Home size={28} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">{tRS('NoRoomsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRooms.map((rm) => {
              const { badge } = statusColor(rm.status);
              const building = buildings.find((b) => b.id === rm.building_id);
              const floor = floors.find((f) => f.id === rm.floor_id);

              return (
                <div
                  key={rm.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-gray-100 transition-all hover:shadow-md hover:ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-gray-600"
                >
                  <div className="mb-1">
                    <h3 className="pr-4 text-sm font-bold text-gray-900 dark:text-white">
                      {rm.code}
                    </h3>
                    <span
                      className={`mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge}`}
                    >
                      {t(`Status_${rm.status}`)}
                    </span>
                    {(building || floor) && (
                      <p className="mt-1.5 truncate text-[10px] text-gray-400">
                        {building?.name}
                        {floor ? ` · ${floor.identifier}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Meter readings */}
                  {(() => {
                    const meters = roomMeters.get(rm.id) ?? [];
                    if (meters.length === 0) return null;
                    return (
                      <div className="mb-2 space-y-1">
                        {meters.map((m) => {
                          const current = m.latest_reading ?? m.initial_reading;
                          const isElectric = m.service_name
                            ?.toLowerCase()
                            .includes('electric');
                          const isWater = m.service_name
                            ?.toLowerCase()
                            .includes('water');

                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <div className="flex shrink-0 items-center justify-center rounded-sm bg-gray-100 p-0.5 text-gray-400 dark:bg-gray-700/50">
                                  {isElectric ? (
                                    <Zap size={10} className="text-amber-500" />
                                  ) : isWater ? (
                                    <Droplets
                                      size={10}
                                      className="text-blue-500"
                                    />
                                  ) : (
                                    <Activity size={10} />
                                  )}
                                </div>
                                <span className="truncate text-[10px] text-gray-400">
                                  {tRS('CurrentReading')}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                {Number(current).toLocaleString()}{' '}
                                {m.service_unit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setManagingRoomPrice(rm)}
                      title={tRS('ManagePricingTitle')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 py-1.5 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                      <Settings2 size={11} />
                      {tRS('ServicesButton')}
                    </button>
                    <button
                      onClick={() => setManagingRoomMeters(rm)}
                      title={tRS('MetersTitle')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-teal-50 py-1.5 text-[11px] font-semibold text-teal-600 transition-colors hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40"
                    >
                      <Activity size={11} />
                      {tRS('MetersButton')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {managingRoomPrice && (
        <RoomPricingModal
          room={managingRoomPrice}
          onClose={handlePriceModalClose}
        />
      )}
      {managingRoomMeters && (
        <MeterManagementModal
          room={managingRoomMeters}
          onClose={handleMeterModalClose}
        />
      )}
    </div>
  );
}

export default function RoomServicesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <RoomServicesContent />
    </React.Suspense>
  );
}
