'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRooms } from '@/hooks/use-rooms';
import { RoomCard } from '@/components/buildings/RoomCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';

function RoomGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between overflow-hidden rounded-xl bg-gray-card p-5 shadow-sm ring-1 ring-inset ring-gray-border"
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoomsPageContent() {
  const t = useTranslations('Buildings');
  const searchParams = useSearchParams();
  const initialBuildingId = searchParams.get('buildingId') || 'all';
  const initialFloorId = searchParams.get('floorId') || 'all';

  const {
    buildings,
    floors,
    availableFloors,
    filteredRooms,
    modalAvailableFloors,
    loading,
    selectedBuildingId,
    selectedFloorId,
    selectedStatus,
    isCreateModalOpen,
    newBuildingId,
    newFloorId,
    newRoomCode,
    isSubmitting,
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedStatus,
    setIsCreateModalOpen,
    setNewBuildingId,
    setNewFloorId,
    setNewRoomCode,
    handleClearFilters,
    handleCreate,
  } = useRooms({
    initialBuildingId,
    initialFloorId,
  });

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-xl border border-gray-border bg-gray-card shadow-sm">
      <PageHeader
        variant="split"
        title={t('Rooms')}
        description={`${filteredRooms.length} ${t('Rooms').toLowerCase()}`}
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-center text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('AddRoom') || 'Add Room'}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <label className="mr-2 text-body font-medium text-gray-text">
              {t('Building') || 'Building'}:
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="block w-48 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">
                -- {t('AllBuildings') || 'All Buildings'} --
              </option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="mr-2 text-body font-medium text-gray-text">
              {t('Floor') || 'Floor'}:
            </label>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="block w-48 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">
                -- {t('AllFloors') || 'All Floors'} --
              </option>
              {availableFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.identifier}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-body font-medium text-gray-text">
              {t('Status') || 'Status'}:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-40 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">
                -- {t('AllStatus') || 'Tất cả trạng thái'} --
              </option>
              <option value="VACANT">{t('Status_VACANT')}</option>
              <option value="OCCUPIED">{t('Status_OCCUPIED')}</option>
            </select>
          </div>

          {(selectedBuildingId !== 'all' ||
            selectedFloorId !== 'all' ||
            selectedStatus !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center text-body font-medium text-danger hover:text-danger-hover"
            >
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {t('ClearFilters') || 'Xóa lọc'}
            </button>
          )}
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-surface">
        {loading ? (
          <RoomGridSkeleton />
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-border p-12 text-center text-gray-muted">
            {t('EmptyRooms')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredRooms.map((rm) => {
              const bName =
                buildings.find((b) => b.id === rm.building_id)?.name ||
                'Unknown';
              const fName =
                floors.find((f) => f.id === rm.floor_id)?.identifier || '-';
              return (
                <RoomCard
                  key={rm.id}
                  room={rm}
                  buildingName={bName}
                  floorName={fName}
                />
              );
            })}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-strong/50 p-4">
          <div className="relative w-full max-w-md h-full md:h-auto">
            <div className="relative rounded-lg bg-gray-card shadow border border-gray-border">
              <div className="flex items-start justify-between rounded-t border-b border-gray-border p-4">
                <h3 className="text-h2 font-semibold text-gray-text">
                  {t('AddRoom')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-body text-gray-muted hover:bg-gray-surface hover:text-gray-text"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-6">
                <div>
                  <label className="mb-2 block text-body font-medium text-gray-text">
                    {t('Building')} <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    value={newBuildingId}
                    onChange={(e) => setNewBuildingId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
                  >
                    <option value="" disabled>
                      -- {t('SelectPropertyFirst')} --
                    </option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-body font-medium text-gray-text">
                    {t('Floor')} <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    disabled={!newBuildingId}
                    value={newFloorId}
                    onChange={(e) => setNewFloorId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary disabled:opacity-50"
                  >
                    <option value="" disabled>
                      -- Chọn tầng --
                    </option>
                    {modalAvailableFloors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.identifier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-body font-medium text-gray-text">
                    {t('Code')} <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    placeholder={t('PlaceholderRoomCode')}
                    className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-border">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !newFloorId || !newRoomCode.trim()
                    }
                    className="rounded-lg bg-primary-hover px-5 py-2.5 text-center text-body font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50"
                  >
                    {isSubmitting ? t('Saving') : t('Creating')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-lg border border-gray-border bg-gray-card px-5 py-2.5 text-body font-medium text-gray-muted hover:bg-gray-surface hover:text-gray-text focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-border"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <RoomsPageContent />
    </React.Suspense>
  );
}
