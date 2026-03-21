'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { BuildingStream } from '@/components/buildings/BuildingStream';
import { BuildingDetailPanel } from '@/components/buildings/BuildingDetailPanel';
import { Building } from '@nhatroso/shared';
import { getBuildings } from '@/services/api/buildings';

export default function BuildingsPage() {
  const t = useTranslations('Buildings');
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchBuildings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBuildings();
      setBuildings(data);
    } catch (err) {
      console.error('Failed to fetch buildings', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const selectedBuilding = React.useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) || null,
    [buildings, selectedBuildingId],
  );

  const handleCreateNew = () => {
    setSelectedBuildingId(null);
    setIsCreating(true);
  };

  const handleSelectBuilding = (id: string) => {
    setIsCreating(false);
    setSelectedBuildingId(id);
  };

  const handleClosePanel = () => {
    setIsCreating(false);
    setSelectedBuildingId(null);
  };

  return (
    <div className="flex h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Left: Building list */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 ${
          selectedBuildingId || isCreating
            ? 'hidden w-full md:flex md:w-[360px] lg:w-[400px]'
            : 'flex w-full md:w-[360px] lg:w-[400px]'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('Heading')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {buildings.length} {t('Heading').toLowerCase()}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            aria-label={t('CreateBuilding')}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 p-2">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : (
            <BuildingStream
              buildings={buildings}
              selectedId={selectedBuildingId}
              onSelect={handleSelectBuilding}
            />
          )}
        </div>
      </div>

      {/* Right: Detail/Edit Panel */}
      <div
        className={`flex-1 overflow-hidden bg-gray-50/50 transition-all duration-300 dark:bg-gray-900/50 ${
          selectedBuildingId || isCreating ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedBuildingId || isCreating ? (
          <BuildingDetailPanel
            building={selectedBuilding}
            isCreating={isCreating}
            onClose={handleClosePanel}
            onSuccess={() => {
              fetchBuildings();
              if (isCreating) {
                setIsCreating(false);
              }
            }}
          />
        ) : (
          <div className="hidden h-full w-full items-center justify-center md:flex">
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400">
                <svg
                  className="h-10 w-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('SelectPropertyFirst')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Choose a building from the list on the left to view or edit its
                details, manage spaces, and settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
