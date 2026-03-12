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
    <div className="flex h-full w-full flex-col bg-transparent">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white/50 px-6 py-5 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isCreating ? t('CreateBuilding') : building?.name}
          </h2>
          {!isCreating && building && (
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  building.status === 'ACTIVE'
                    ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20'
                    : 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-600/20'
                }`}
              >
                {t(`Status_${building.status}`)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {building.address ? building.address : t('NoAddress')}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 md:hidden dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Close panel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      {!isCreating && building && (
        <div className="border-b border-gray-100 bg-white/30 px-6 dark:border-gray-700/50 dark:bg-gray-800/30">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {t('Overview')}
            </button>
            <button
              onClick={() => setActiveTab('spaces')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'spaces'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {t('ManageSpaces')}
            </button>
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {(activeTab === 'overview' || isCreating) && (
          <div className="p-4 lg:p-6">
            <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5 dark:border-gray-700/50 dark:bg-gray-800 dark:ring-white/10">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700/50 dark:bg-gray-800/50">
                <h3 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  {isCreating ? t('CreateBuilding') : t('BuildingDetails')}
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {t('BuildingDetailsDescription') || 'Update the basic information of this property.'}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="px-6 py-6">
                <div className="space-y-5">
                  {error && (
                    <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                      <div className="flex">
                        <div className="shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">{error}</h3>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      {t('Name')} <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        id="name"
                        type="text"
                        required
                        disabled={isSubmitting || building?.status === 'ARCHIVED'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500 dark:disabled:bg-gray-800"
                        placeholder={t('PlaceholderBuildingName')}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      {t('Address')}
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="address"
                        rows={3}
                        disabled={isSubmitting || building?.status === 'ARCHIVED'}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 sm:text-sm sm:leading-6 dark:bg-gray-700/50 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500 dark:disabled:bg-gray-800"
                        placeholder={t('PlaceholderBuildingAddress')}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-x-4 border-t border-gray-900/5 pt-6 dark:border-white/5">
                  {!isCreating && building?.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={isSubmitting}
                      className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50 dark:bg-transparent dark:text-red-400 dark:ring-red-500/30 dark:hover:bg-red-500/10"
                    >
                      {isSubmitting ? '...' : t('Archive')}
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || building?.status === 'ARCHIVED'}
                    className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    {isSubmitting
                      ? t('Saving')
                      : isCreating
                        ? t('Creating')
                        : t('Update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!isCreating && building && activeTab === 'spaces' && (
          <div className="h-full">
            <SpaceManager buildingId={building.id} />
          </div>
        )}
      </div>
    </div>
  );
}
