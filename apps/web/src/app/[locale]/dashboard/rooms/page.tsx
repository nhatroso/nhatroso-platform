'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Building, Floor, Room } from '@nhatroso/shared';
import { getBuildings, getAllFloors } from '@/services/api/buildings';
import { getAllRooms, createRoom } from '@/services/api/rooms';
import { RoomPricingModal } from '@/components/buildings/RoomPricingModal';
import { roomServicesApi } from '@/services/api/room-services';
import { servicesApi } from '@/services/api/services';

function RoomsPageContent() {
  const t = useTranslations('Buildings');
  const searchParams = useSearchParams();
  const initialBuildingId = searchParams.get('buildingId') || 'all';
  const initialFloorId = searchParams.get('floorId') || 'all';

  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [selectedBuildingId, setSelectedBuildingId] =
    React.useState<string>(initialBuildingId);
  const [selectedFloorId, setSelectedFloorId] =
    React.useState<string>(initialFloorId);

  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
  const [managingRoomPrice, setManagingRoomPrice] = React.useState<Room | null>(
    null,
  );

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newBuildingId, setNewBuildingId] = React.useState('');
  const [newFloorId, setNewFloorId] = React.useState('');
  const [newRoomCode, setNewRoomCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [bData, fData, rData] = await Promise.all([
          getBuildings(),
          getAllFloors(),
          getAllRooms(),
        ]);
        setBuildings(bData);
        setFloors(fData);
        setRooms(rData);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const availableFloors = React.useMemo(() => {
    if (selectedBuildingId === 'all') return floors;
    return floors.filter((f) => f.building_id === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  // If selected floor is not in available floors, reset it
  React.useEffect(() => {
    if (selectedFloorId !== 'all') {
      const exists = availableFloors.find((f) => f.id === selectedFloorId);
      if (!exists) setSelectedFloorId('all');
    }
  }, [availableFloors, selectedFloorId]);

  const filteredRooms = React.useMemo(() => {
    return rooms.filter((r) => {
      const matchBuilding =
        selectedBuildingId === 'all' || r.building_id === selectedBuildingId;
      const matchFloor =
        selectedFloorId === 'all' || r.floor_id === selectedFloorId;
      const matchStatus =
        selectedStatus === 'all' || r.status === selectedStatus;
      return matchBuilding && matchFloor && matchStatus;
    });
  }, [rooms, selectedBuildingId, selectedFloorId, selectedStatus]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'VACANT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'DEPOSITED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleClearFilters = () => {
    setSelectedBuildingId('all');
    setSelectedFloorId('all');
    setSelectedStatus('all');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorId || !newRoomCode.trim()) return;
    try {
      setIsSubmitting(true);
      await createRoom(newFloorId, { code: newRoomCode });
      setIsCreateModalOpen(false);
      setNewRoomCode('');
      setNewFloorId('');
      setNewBuildingId('');

      const rData = await getAllRooms();
      setRooms(rData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalAvailableFloors = React.useMemo(() => {
    if (!newBuildingId) return [];
    return floors.filter((f) => f.building_id === newBuildingId);
  }, [floors, newBuildingId]);

  // Reset floor when building changes in modal
  React.useEffect(() => {
    setNewFloorId('');
  }, [newBuildingId]);

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('Rooms')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filteredRooms.length} {t('Rooms').toLowerCase()}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('Building') || 'Building'}:
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="block w-48 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('Floor') || 'Floor'}:
            </label>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="block w-48 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('Status') || 'Status'}:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-40 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
              className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
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
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t('EmptyRooms')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredRooms.map((rm) => {
              const bName =
                buildings.find((b) => b.id === rm.building_id)?.name ||
                'Unknown';
              const fName =
                floors.find((f) => f.id === rm.floor_id)?.identifier || '-';
              return (
                <div
                  key={rm.id}
                  className="max-w-sm rounded-lg border border-gray-200 bg-white shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 transition-all duration-200"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {rm.code}
                      </h5>
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${statusColor(rm.status)}`}
                      >
                        {t(`Status_${rm.status}`)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p
                        className="text-sm font-normal text-gray-700 dark:text-gray-400 mb-1 line-clamp-1"
                        title={bName}
                      >
                        <span className="font-semibold">
                          {t('Building') || 'Building'}:
                        </span>{' '}
                        {bName}
                      </p>
                      <p className="text-sm font-normal text-gray-700 dark:text-gray-400">
                        <span className="font-semibold">
                          {t('Floor') || 'Floor'}:
                        </span>{' '}
                        {fName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                      {rm.status === 'OCCUPIED' && (
                        <div className="flex w-full items-center justify-between group">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('Pricing')}
                          </span>
                          <button
                            onClick={() => setManagingRoomPrice(rm)}
                            className="inline-flex items-center rounded-lg bg-gray-100 p-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 shadow-sm"
                            title={t('Pricing') || 'Pricing'}
                          >
                            <svg
                              className="h-4 w-4"
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {managingRoomPrice && (
        <RoomPricingModal
          room={managingRoomPrice}
          onClose={() => setManagingRoomPrice(null)}
        />
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 p-4">
          <div className="relative w-full max-w-md h-full md:h-auto">
            <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="flex items-start justify-between rounded-t border-b p-4 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('AddRoom')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
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
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    {t('Building')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newBuildingId}
                    onChange={(e) => setNewBuildingId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    {t('Floor')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!newBuildingId}
                    value={newFloorId}
                    onChange={(e) => setNewFloorId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    {t('Code')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    placeholder={t('PlaceholderRoomCode')}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !newFloorId || !newRoomCode.trim()
                    }
                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    {isSubmitting ? t('Saving') : t('Creating')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <RoomsPageContent />
    </React.Suspense>
  );
}
