'use client';

import { useTranslations } from 'next-intl';
import { BuildingStream } from '@/components/buildings/BuildingStream';
import { BuildingDetailPanel } from '@/components/buildings/BuildingDetailPanel';
import { useBuildings } from '@/hooks/use-buildings';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icons } from '@/components/icons';

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-gray-border bg-gray-card p-3 shadow-sm"
        >
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BuildingsPage() {
  const t = useTranslations('Buildings');
  const {
    buildings,
    isLoading,
    isCreating,
    selectedBuildingId,
    selectedBuilding,
    handleCreateNew,
    handleSelectBuilding,
    handleClosePanel,
    handleSuccess,
  } = useBuildings();

  return (
    <div className="flex h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-gray-border bg-gray-card shadow-sm">
      {/* Left: Building list */}
      <div
        className={`flex flex-col border-r border-gray-border bg-gray-card transition-all duration-300 ${
          selectedBuildingId || isCreating
            ? 'hidden w-full md:flex md:w-[360px] lg:w-[400px]'
            : 'flex w-full md:w-[360px] lg:w-[400px]'
        }`}
      >
        <PageHeader
          variant="split"
          title={t('Heading')}
          description={`${buildings.length} ${t('Heading').toLowerCase()}`}
          actions={
            <button
              onClick={handleCreateNew}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-hover font-medium text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary-light dark:bg-primary dark:hover:bg-primary-hover dark:focus:ring-primary-dark"
              aria-label={t('CreateBuilding')}
            >
              <Icons.Plus className="h-5 w-5" />
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto bg-gray-surface p-2">
          {isLoading ? (
            <ListSkeleton />
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
        className={`flex-1 overflow-hidden bg-gray-surface transition-all duration-300 ${
          selectedBuildingId || isCreating ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedBuildingId || isCreating ? (
          <BuildingDetailPanel
            building={selectedBuilding}
            isCreating={isCreating}
            onClose={handleClosePanel}
            onSuccess={handleSuccess}
          />
        ) : (
          <div className="hidden h-full w-full items-center justify-center md:flex">
            <div className="flex flex-col items-center text-center p-8 bg-gray-card rounded-xl shadow-sm border border-gray-border">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary">
                <Icons.Property className="h-10 w-10" />
              </div>
              <h3 className="text-h2 font-bold text-gray-text">
                {t('SelectPropertyFirst')}
              </h3>
              <p className="mt-2 text-body text-gray-muted max-w-sm">
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
