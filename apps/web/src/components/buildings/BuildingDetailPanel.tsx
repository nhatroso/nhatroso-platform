import * as React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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

  React.useEffect(() => {
    setName(building?.name || '');
    setAddress(building?.address || '');
    setError(null);
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
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isCreating ? t('CreateBuilding') : building?.name}
          </h2>
          {!isCreating && building && (
            <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  building.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {t(`Status_${building.status}`)}
              </span>
              <span>•</span>
              <span>
                {building.address ? building.address : t('NoAddress')}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200 md:hidden dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
          aria-label="Close panel"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      {!isCreating && building && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400 px-6">
            <li className="mr-2">
              <button
                className="inline-block p-4 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active dark:text-blue-500 dark:border-blue-500"
                aria-current="page"
              >
                {t('Overview')}
              </button>
            </li>
            <li className="mr-2">
              <Link
                href={`/dashboard/floors?buildingId=${building.id}`}
                className="inline-flex items-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              >
                {t('Floors')}
              </Link>
            </li>
            <li className="mr-2">
              <Link
                href={`/dashboard/rooms?buildingId=${building.id}`}
                className="inline-flex items-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              >
                {t('Rooms')}
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 p-6">
        <div className="mx-auto max-w-2xl bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isCreating ? t('CreateBuilding') : t('BuildingDetails')}
            </h3>
            <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
              {t('BuildingDetailsDescription') ||
                'Update the basic information of this property.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {error && (
                <div
                  className="flex p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                  role="alert"
                >
                  <svg
                    className="flex-shrink-0 inline w-5 h-5 me-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                  </svg>
                  <span className="sr-only">Error</span>
                  <div>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {t('Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={isSubmitting || building?.status === 'ARCHIVED'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder={t('PlaceholderBuildingName')}
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {t('Address')}
                </label>
                <textarea
                  id="address"
                  rows={3}
                  disabled={isSubmitting || building?.status === 'ARCHIVED'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder={t('PlaceholderBuildingAddress')}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              {!isCreating && building?.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isSubmitting}
                  className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900 disabled:opacity-50"
                >
                  {isSubmitting ? '...' : t('Archive')}
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || building?.status === 'ARCHIVED'}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 disabled:opacity-50"
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
    </div>
  );
}
