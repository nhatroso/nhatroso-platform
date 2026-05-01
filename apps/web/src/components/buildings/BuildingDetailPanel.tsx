import * as React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Building,
} from '@nhatroso/shared';
import { useBuildingDetail } from '@/hooks/building/useBuildingDetail';

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
  const {
    name,
    setName,
    address,
    setAddress,
    error,
    isSubmitting,
    handleSubmit,
    handleArchive,
  } = useBuildingDetail({ building, isCreating, onSuccess });

  return (
    <div className="flex h-full w-full flex-col bg-gray-card overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-border bg-gray-surface px-6 py-5">
        <div>
          <h2 className="text-h2 font-bold tracking-tight text-gray-text">
            {isCreating ? t('CreateBuilding') : building?.name}
          </h2>
          {!isCreating && building && (
            <div className="mt-1.5 flex items-center gap-2 text-body text-gray-muted">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-tiny font-semibold ${
                  building.status === 'ACTIVE'
                    ? 'bg-success-light text-success dark:bg-success-dark/20 dark:text-success-dark'
                    : 'bg-gray-subtle text-gray-muted'
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
          className="rounded-lg p-2 text-gray-muted transition-colors hover:bg-gray-surface hover:text-gray-text focus:outline-none focus:ring-4 focus:ring-gray-border md:hidden"
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
        <div className="border-b border-gray-border">
          <ul className="flex flex-wrap -mb-px text-body font-medium text-center text-gray-muted px-6">
            <li className="mr-2">
              <button
                className="inline-block p-4 text-primary border-b-2 border-primary rounded-t-lg active dark:text-primary-dark dark:border-primary-dark"
                aria-current="page"
              >
                {t('Overview')}
              </button>
            </li>
            <li className="mr-2">
              <Link
                href={`/dashboard/buildings/floors?buildingId=${building.id}`}
                className="inline-flex items-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-text hover:border-gray-border"
              >
                {t('Floors')}
              </Link>
            </li>
            <li className="mr-2">
              <Link
                href={`/dashboard/buildings/rooms?buildingId=${building.id}`}
                className="inline-flex items-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-text hover:border-gray-border"
              >
                {t('Rooms')}
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-surface/50 p-6">
        <div className="mx-auto max-w-2xl bg-gray-card rounded-xl border border-gray-border shadow-sm overflow-hidden">
          <div className="border-b border-gray-border bg-gray-surface px-6 py-4">
            <h3 className="text-h3 font-bold text-gray-text">
              {isCreating ? t('CreateBuilding') : t('BuildingDetails')}
            </h3>
            <p className="mt-1 text-body font-normal text-gray-muted">
              {t('BuildingDetailsDescription') ||
                'Update the basic information of this property.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {error && (
                <div
                  className="flex p-4 mb-4 text-body text-danger rounded-lg bg-danger-light dark:bg-danger-dark/10 dark:text-danger-dark"
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
                  className="block mb-2 text-body font-medium text-gray-text"
                >
                  {t('Name')} <span className="text-danger">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={isSubmitting || building?.status === 'ARCHIVED'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-input border border-gray-border text-gray-text text-body rounded-lg focus:ring-primary focus:border-primary"
                  placeholder={t('PlaceholderBuildingName')}
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block mb-2 text-body font-medium text-gray-text"
                >
                  {t('Address')}
                </label>
                <textarea
                  id="address"
                  rows={3}
                  disabled={isSubmitting || building?.status === 'ARCHIVED'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block p-2.5 w-full text-body text-gray-text bg-gray-input rounded-lg border border-gray-border focus:ring-primary focus:border-primary disabled:opacity-50"
                  placeholder={t('PlaceholderBuildingAddress')}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-x-4 border-t border-gray-border pt-6">
              {!isCreating && building?.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isSubmitting}
                  className="text-danger hover:text-white border border-danger hover:bg-danger-hover focus:ring-4 focus:outline-none focus:ring-danger-light font-medium rounded-lg text-body px-5 py-2.5 text-center dark:border-danger-dark dark:text-danger-dark dark:hover:text-white dark:hover:bg-danger dark:focus:ring-danger-hover disabled:opacity-50"
                >
                  {isSubmitting ? '...' : t('Archive')}
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || building?.status === 'ARCHIVED'}
                className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-primary-light font-medium rounded-lg text-body px-5 py-2.5 dark:bg-primary dark:hover:bg-primary-hover focus:outline-none dark:focus:ring-primary-hover disabled:opacity-50"
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
