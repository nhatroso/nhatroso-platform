'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Building, Floor } from '@nhatroso/shared';
import {
  getBuildings,
  getAllFloors,
  createFloor,
} from '@/services/api/buildings';
import { RoomList } from '@/components/buildings/RoomList';

function FloorsPageContent() {
  const t = useTranslations('Buildings');
  const searchParams = useSearchParams();
  const initialBuildingId = searchParams.get('buildingId') || 'all';

  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedBuildingId, setSelectedBuildingId] =
    React.useState<string>(initialBuildingId);
  const [expandedFloorId, setExpandedFloorId] = React.useState<string | null>(
    null,
  );

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newBuildingId, setNewBuildingId] = React.useState('');
  const [newFloorName, setNewFloorName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [bData, fData] = await Promise.all([
          getBuildings(),
          getAllFloors(),
        ]);
        setBuildings(bData);
        setFloors(fData);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredFloors = React.useMemo(() => {
    if (selectedBuildingId === 'all') return floors;
    return floors.filter((f) => f.building_id === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingId || !newFloorName.trim()) return;
    try {
      setIsSubmitting(true);
      await createFloor(newBuildingId, { identifier: newFloorName });
      setIsCreateModalOpen(false);
      setNewFloorName('');
      setNewBuildingId('');
      // refresh floors
      const fData = await getAllFloors();
      setFloors(fData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('Floors')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filteredFloors.length} {t('Floors').toLowerCase()}
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
            {t('AddFloor') || 'Add Floor'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-900 dark:text-white">
            {t('Building') || 'Building'}:
          </label>
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="block w-64 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : filteredFloors.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t('EmptyFloors')}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFloors.map((fl) => {
              const buildingName =
                buildings.find((b) => b.id === fl.building_id)?.name ||
                'Unknown';
              const isExpanded = expandedFloorId === fl.id;

              return (
                <div
                  key={fl.id}
                  className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                    isExpanded
                      ? 'border-blue-300 bg-white shadow-md dark:border-blue-500/50 dark:bg-gray-800'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFloorId((prev) =>
                        prev === fl.id ? null : fl.id,
                      )
                    }
                    className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-bold transition-colors ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                        >
                          {fl.identifier}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                            fl.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {t(`Status_${fl.status}`)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('Building') || 'Building'}:{' '}
                        <span className="text-gray-900 dark:text-gray-300">
                          {buildingName}
                        </span>
                      </span>
                    </div>
                    <div
                      className={`rounded-full p-2 transition-colors ${isExpanded ? 'bg-blue-50 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-700'}`}
                    >
                      <svg
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                      <RoomList floorId={fl.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 p-4">
          <div className="relative w-full max-w-md h-full md:h-auto">
            <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="flex items-start justify-between rounded-t border-b p-4 dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('AddFloor')}
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
                    {t('Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    placeholder={t('PlaceholderFloorName')}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !newBuildingId || !newFloorName.trim()
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

export default function FloorsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <FloorsPageContent />
    </React.Suspense>
  );
}
