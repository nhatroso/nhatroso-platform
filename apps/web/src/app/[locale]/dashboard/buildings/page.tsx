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
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-zinc-50 tracking-tight text-zinc-900">
      {/*
        Radical Design: 30/70 Asymmetric Split (Continuous Stream on left).
        If nothing selected on mobile, full width. If selected, panel takes over.
      */}
      <div
        className={`flex-col border-r border-zinc-200 bg-white transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          selectedBuildingId || isCreating
            ? 'hidden w-full md:flex md:w-[30%] lg:w-[25%]'
            : 'flex w-full md:w-[30%] lg:w-[25%]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter">
            {t('Heading')}
          </h1>
          <button
            onClick={handleCreateNew}
            className="flex h-10 w-10 items-center justify-center rounded-none bg-zinc-900 text-white transition-transform hover:scale-105 hover:bg-orange-600 active:scale-95"
            aria-label={t('CreateBuilding')}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <span className="text-sm font-medium uppercase text-zinc-400">
                Loading...
              </span>
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

      {/* Detail/Edit Panel Segment */}
      <div
        className={`flex-1 bg-zinc-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          selectedBuildingId || isCreating
            ? 'translate-x-0 opacity-100'
            : 'translate-x-8 opacity-0 pointer-events-none md:pointer-events-auto md:translate-x-0 md:opacity-100'
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
                // Keep panel open after create or optionally close it. Let's close for now or let them see the new one.
                setIsCreating(false);
              }
            }}
          />
        ) : (
          <div className="hidden h-full items-center justify-center md:flex">
            <div className="text-center">
              <div className="mb-4 inline-flex h-24 w-24 items-center justify-center border-2 border-dashed border-zinc-300 text-zinc-300">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-zinc-400">
                SELECT A PROPERTY
              </h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
