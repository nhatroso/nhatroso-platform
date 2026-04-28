'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useFloors } from '@/hooks/use-floors';
import { RoomList } from '@/components/buildings/RoomList';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icons } from '@/components/icons';

function FloorListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-gray-border bg-gray-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FloorsPageContent() {
  const t = useTranslations('Buildings');
  const searchParams = useSearchParams();
  const initialBuildingId = searchParams.get('buildingId') || 'all';

  const {
    buildings,
    filteredFloors,
    loading,
    selectedBuildingId,
    expandedFloorId,
    isCreateModalOpen,
    newBuildingId,
    newFloorName,
    isSubmitting,
    setSelectedBuildingId,
    setIsCreateModalOpen,
    setNewBuildingId,
    setNewFloorName,
    handleCreate,
    toggleFloorExpansion,
  } = useFloors({ initialBuildingId });

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filteredAndSearchedFloors = React.useMemo(() => {
    return filteredFloors.filter((f) => {
      const matchSearch = f.identifier
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [filteredFloors, searchTerm, statusFilter]);

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-2xl border border-gray-border bg-gray-card shadow-sm animate-in fade-in duration-500">
      <PageHeader
        variant="split"
        title={t('Floors')}
        description={`${filteredAndSearchedFloors.length} ${t('Floors').toLowerCase()}`}
        icon={Icons.Floor}
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-body font-bold text-white transition-all hover:bg-primary-hover hover:shadow-md active:scale-95 shadow-sm"
          >
            <Icons.Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
            {t('AddFloor') || 'Add Floor'}
          </button>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center relative">
              <Icons.Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="block w-64 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-10 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
              >
                <option value="all">
                  {t('AllBuildings') || 'All Buildings'}
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center relative">
              <Icons.Meter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-52 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-10 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
              >
                <option value="all">{t('AllStatus')}</option>
                <option value="ACTIVE">{t('Status_ACTIVE')}</option>
                <option value="ARCHIVED">{t('Status_ARCHIVED')}</option>
              </select>
            </div>
            {(selectedBuildingId !== 'all' ||
              searchTerm !== '' ||
              statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedBuildingId('all');
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center text-[11px] font-bold text-danger hover:text-danger-hover uppercase tracking-wider"
              >
                <Icons.Close className="mr-1 h-3.5 w-3.5" />
                {t('ClearFilters') || 'Xóa lọc'}
              </button>
            )}
            <div className="relative ml-auto">
              <Icons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <input
                type="text"
                placeholder={t('SearchFloorPlaceholder') || 'Tìm tên tầng...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-64 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-surface/30">
        {loading ? (
          <FloorListSkeleton />
        ) : filteredAndSearchedFloors.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-gray-border bg-gray-card/50">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-surface border border-gray-border shadow-inner">
              <Icons.Floor className="h-8 w-8 text-gray-muted/40" />
            </div>
            <p className="text-body font-bold text-gray-text">
              {t('EmptyFloors')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSearchedFloors.map((fl) => {
              const buildingName =
                buildings.find((b) => b.id === fl.building_id)?.name ||
                'Unknown';
              const isExpanded = expandedFloorId === fl.id;

              return (
                <div
                  key={fl.id}
                  className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                    isExpanded
                      ? 'border-primary-light bg-gray-card shadow-md'
                      : 'border-gray-border bg-gray-card hover:shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFloorExpansion(fl.id)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-h3 font-bold transition-colors ${isExpanded ? 'text-primary' : 'text-gray-text'}`}
                        >
                          {fl.identifier}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-tiny font-semibold ${
                            fl.status === 'ACTIVE'
                              ? 'bg-success-light text-success'
                              : 'bg-gray-subtle text-gray-muted'
                          }`}
                        >
                          {t(`Status_${fl.status}`)}
                        </span>
                      </div>
                      <span className="text-body font-medium text-gray-muted">
                        {t('Building') || 'Building'}:{' '}
                        <span className="text-gray-text">{buildingName}</span>
                      </span>
                    </div>
                    <div
                      className={`rounded-full p-2 transition-colors ${isExpanded ? 'bg-primary-light' : 'bg-gray-surface'}`}
                    >
                      <svg
                        className={`h-5 w-5 text-gray-muted transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
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
                    <div className="border-t border-gray-border bg-gray-card p-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-strong/50 p-4">
          <div className="relative h-full w-full max-w-xl md:h-auto">
            <div className="relative rounded-lg bg-gray-card shadow">
              <div className="flex items-start justify-between rounded-t border-b p-4 border-gray-border">
                <h3 className="text-h2 font-semibold text-gray-text">
                  {t('AddFloor')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-body text-gray-muted hover:bg-gray-subtle hover:text-gray-text"
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
                    {t('Name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    placeholder={t('PlaceholderFloorName')}
                    className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-border">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !newBuildingId || !newFloorName.trim()
                    }
                    className="rounded-lg bg-primary px-5 py-2.5 text-center text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50"
                  >
                    {isSubmitting ? t('Saving') : t('Creating')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-lg border border-gray-border bg-gray-card px-5 py-2.5 text-body font-medium text-gray-muted hover:bg-gray-subtle hover:text-gray-text focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-subtle"
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <FloorsPageContent />
    </React.Suspense>
  );
}
