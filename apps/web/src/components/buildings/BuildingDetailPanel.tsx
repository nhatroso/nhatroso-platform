import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Building,
  CreateBuildingInput,
  UpdateBuildingInput,
} from '@nhatroso/shared';
import {
  createBuilding,
  updateBuilding,
  archiveBuilding,
} from '@/services/api/buildings';
import { SpaceManager } from './SpaceManager';

interface BuildingDetailPanelProps {
  building: Building | null;
  isCreating: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BuildingDetailPanel({
  building,
  isCreating,
  onClose,
  onSuccess,
}: BuildingDetailPanelProps) {
  const t = useTranslations('Buildings');
  const tErr = useTranslations('Errors');

  const [name, setName] = React.useState(building?.name || '');
  const [address, setAddress] = React.useState(building?.address || '');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<'overview' | 'spaces'>(
    'overview',
  );

  React.useEffect(() => {
    setName(building?.name || '');
    setAddress(building?.address || '');
    setError(null);
    if (isCreating) {
      setActiveTab('overview');
    }
  }, [building, isCreating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isCreating) {
        const payload: CreateBuildingInput = {
          name,
          address: address || undefined,
        };
        await createBuilding(payload);
      } else if (building) {
        const payload: UpdateBuildingInput = {
          name,
          address: address || undefined,
        };
        await updateBuilding(building.id, payload);
      }
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'RESOURCE_ARCHIVED') {
        setError(tErr('BUILDING_UPDATE_ARCHIVED'));
      } else {
        setError(tErr('UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!building) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await archiveBuilding(building.id);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'BUILDING_HAS_ACTIVE_ROOMS') {
        setError(tErr('BUILDING_HAS_ACTIVE_ROOMS'));
      } else {
        setError(tErr('UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white p-6 md:p-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 md:text-5xl">
            {isCreating ? t('CreateBuilding') : building?.name}
          </h2>
          {!isCreating && building && (
            <div className="mt-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
              ID: {building.id} | {t('Status')}:{' '}
              <span
                className={
                  building.status === 'ACTIVE'
                    ? 'text-orange-600'
                    : 'text-zinc-400'
                }
              >
                {t(`Status_${building.status}`)}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-12 w-12 items-center justify-center bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {!isCreating && building && (
        <div className="flex border-b border-zinc-200 bg-zinc-100 px-6 md:px-10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-8 py-4 font-black uppercase tracking-widest text-sm transition-colors border-b-4 ${
              activeTab === 'overview'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t('Overview')}
          </button>
          <button
            onClick={() => setActiveTab('spaces')}
            className={`px-8 py-4 font-black uppercase tracking-widest text-sm transition-colors border-b-4 ${
              activeTab === 'spaces'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t('ManageSpaces')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-zinc-50">
        {(activeTab === 'overview' || isCreating) && (
          <div className="p-6 md:p-10">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-2xl space-y-8"
            >
              {error && (
                <div className="border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500"
                  >
                    {t('Name')}
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    disabled={isSubmitting || building?.status === 'ARCHIVED'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-none border border-zinc-300 bg-white p-4 text-lg font-bold text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-0 disabled:bg-zinc-100"
                    placeholder={t('PlaceholderBuildingName')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500"
                  >
                    {t('Address')}
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    disabled={isSubmitting || building?.status === 'ARCHIVED'}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-none border border-zinc-300 bg-white p-4 text-lg text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-0 disabled:bg-zinc-100"
                    placeholder={t('PlaceholderBuildingAddress')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4 border-t border-zinc-200">
                <button
                  type="submit"
                  disabled={isSubmitting || building?.status === 'ARCHIVED'}
                  className="flex-1 rounded-none bg-zinc-900 px-8 py-4 font-black uppercase tracking-widest text-white transition-transform hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSubmitting
                    ? t('Saving')
                    : isCreating
                      ? t('Creating')
                      : t('Update')}
                </button>

                {!isCreating && building?.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={isSubmitting}
                    className="rounded-none border border-red-200 bg-white px-8 py-4 font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : t('Archive')}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {!isCreating && building && activeTab === 'spaces' && (
          <div className="h-full bg-white">
            <SpaceManager buildingId={building.id} />
          </div>
        )}
      </div>
    </div>
  );
}
