'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRoomServicesDashboard } from '@/hooks/use-room-services-dashboard';
import { Room } from '@nhatroso/shared';
import { RoomPricingModal } from '@/components/buildings/RoomPricingModal';
import { MeterManagementModal } from '@/components/buildings/MeterManagementModal';
import { Settings2, Activity, Home, Zap, Droplets } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';

function RoomCardSkeleton() {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl bg-gray-card p-4 shadow-sm ring-1 ring-inset ring-gray-border">
      <div className="mb-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="mt-1.5 h-3 w-16" />
        <Skeleton className="mt-2 h-2 w-24" />
      </div>
      <div className="mb-3 space-y-2 border-t border-gray-surface pt-2">
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
        badge: 'bg-success-light text-success',
      };
    case 'OCCUPIED':
      return {
        badge: 'bg-primary-light text-primary',
      };
    case 'DEPOSITED':
      return {
        badge: 'bg-warning-light text-warning',
      };
    case 'MAINTENANCE':
      return {
        badge: 'bg-danger-light text-danger',
      };
    default:
      return {
        badge: 'bg-gray-subtle text-gray-muted',
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
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-xl border border-gray-border bg-gray-card shadow-sm">
      {/* Header */}
      <PageHeader
        variant="split"
        title={tRS('Title')}
        description={tRS('Description')}
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Building filter */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-text">
              {t('Building')}:
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setSelectedFloorId('all');
              }}
              className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-sm text-gray-text focus:border-primary focus:ring-primary"
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
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-text">
              {t('Floor')}:
            </label>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              disabled={availableFloors.length === 0}
              className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-sm text-gray-text focus:border-primary focus:ring-primary"
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
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-text">
              {t('Status')}:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-sm text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">-- {t('AllStatus')} --</option>
              <option value="OCCUPIED">{t('Status_OCCUPIED')}</option>
              <option value="VACANT">{t('Status_VACANT')}</option>
            </select>
          </div>

          <span className="ml-auto text-xs text-gray-muted">
            {tRS('RoomsCount', { count: filteredRooms.length })}
          </span>
        </div>
      </PageHeader>

      {/* Room Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-surface">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-subtle">
              <Home size={28} className="text-gray-muted" />
            </div>
            <p className="text-sm text-gray-muted">{tRS('NoRoomsFound')}</p>
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
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-gray-card p-4 shadow-sm ring-1 ring-inset ring-gray-border transition-all hover:shadow-md hover:ring-primary/20"
                >
                  <div className="mb-1">
                    <h3 className="pr-4 text-sm font-bold text-gray-text">
                      {rm.code}
                    </h3>
                    <span
                      className={`mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge}`}
                    >
                      {t(`Status_${rm.status}`)}
                    </span>
                    {(building || floor) && (
                      <p className="mt-1.5 truncate text-[10px] text-gray-muted">
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
                                <div className="flex shrink-0 items-center justify-center rounded-sm bg-gray-subtle p-0.5 text-gray-muted">
                                  {isElectric ? (
                                    <Zap size={10} className="text-warning" />
                                  ) : isWater ? (
                                    <Droplets
                                      size={10}
                                      className="text-primary"
                                    />
                                  ) : (
                                    <Activity size={10} />
                                  )}
                                </div>
                                <span className="truncate text-[10px] text-gray-muted">
                                  {tRS('CurrentReading')}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-gray-text">
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
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-light py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Settings2 size={11} />
                      {tRS('ServicesButton')}
                    </button>
                    <button
                      onClick={() => setManagingRoomMeters(rm)}
                      title={tRS('MetersTitle')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-light py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-surface border-t-primary" />
        </div>
      }
    >
      <RoomServicesContent />
    </React.Suspense>
  );
}
