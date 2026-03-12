'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Service } from '@nhatroso/shared';
import { servicesApi } from '@/services/api/services';

export default function ServicesPage() {
  const t = useTranslations('Services');
  const [services, setServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedServiceId, setSelectedServiceId] = React.useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const [name, setName] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await servicesApi.list();
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  React.useEffect(() => {
    if (selectedService) {
      setName(selectedService.name);
      setUnit(selectedService.unit);
      setErrorMsg('');
    } else {
      setName('');
      setUnit('');
      setErrorMsg('');
    }
  }, [selectedService, isCreating]);

  const handleCreateNew = () => {
    setSelectedServiceId(null);
    setIsCreating(true);
  };

  const handleSelectService = (id: string) => {
    setIsCreating(false);
    setSelectedServiceId(id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) {
      setErrorMsg(t('ErrorInvalid'));
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (isCreating) {
        await servicesApi.create({ name, unit });
        setIsCreating(false);
      } else if (selectedServiceId) {
        await servicesApi.update(selectedServiceId, { name, unit });
      }
      await fetchServices();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('ErrorDuplicate'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedServiceId) return;
    try {
      await servicesApi.archive(selectedServiceId);
      setSelectedServiceId(null);
      await fetchServices();
    } catch (err) {
      console.error('Failed to archive', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-112px)] w-full overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Left: Service list */}
      <div
        className={`flex flex-col border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          selectedServiceId || isCreating
            ? 'hidden w-full md:flex md:w-[300px] lg:w-[320px]'
            : 'flex w-full md:w-[300px] lg:w-[320px]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('Title')}
          </h1>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center rounded-lg bg-blue-700 p-2 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            aria-label={t('CreateNew')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : services.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('Empty')}
            </div>
          ) : (
            <ul className="flex flex-col">
              {services.map((srv) => {
                const isSelected = srv.id === selectedServiceId;
                return (
                  <li
                    key={srv.id}
                    className="border-b border-gray-200 last:border-0 dark:border-gray-700"
                  >
                    <button
                      onClick={() => handleSelectService(srv.id)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <h3
                        className={`truncate text-sm font-semibold ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-400'
                            : srv.status === 'ARCHIVED'
                              ? 'text-gray-400 line-through dark:text-gray-500'
                              : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {srv.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {srv.unit}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right: Detail/Form */}
      <div
        className={`flex-1 overflow-hidden bg-gray-50 transition-all duration-300 dark:bg-gray-900 ${
          selectedServiceId || isCreating ? 'flex' : 'hidden md:flex'
        }`}
      >
        {!selectedServiceId && !isCreating ? (
          <div className="hidden h-full w-full items-center justify-center md:flex">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('SelectFirst')}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-y-auto p-6">
            <div className="mx-auto max-w-xl">
              {/* Back button (mobile) */}
              <button
                onClick={() => {
                  setIsCreating(false);
                  setSelectedServiceId(null);
                }}
                className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-900 md:hidden dark:text-gray-400 dark:hover:text-white"
              >
                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
                  {isCreating ? t('CreateNew') : selectedService?.name}
                </h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  {isCreating
                    ? t('Description')
                    : `${t('StatusLabel')}: ${
                        selectedService?.status === 'ACTIVE'
                          ? t('Active')
                          : t('Archived')
                      }`}
                </p>

                <form onSubmit={handleSave} className="space-y-5">
                  {errorMsg && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-gray-800 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      {t('NameLabel')}
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('PlaceholderName')}
                      disabled={
                        isSaving || selectedService?.status === 'ARCHIVED'
                      }
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:disabled:bg-gray-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      {t('UnitLabel')}
                    </label>
                    <input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder={t('PlaceholderUnit')}
                      disabled={
                        isSaving || selectedService?.status === 'ARCHIVED'
                      }
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:disabled:bg-gray-600"
                    />
                  </div>

                  <div className="flex items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
                    {(!selectedService ||
                      selectedService.status !== 'ARCHIVED') && (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        {isSaving ? t('Saving') : t('Save')}
                      </button>
                    )}

                    {!isCreating && selectedService?.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        onClick={handleArchive}
                        disabled={isSaving}
                        className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:opacity-50 dark:border-red-600 dark:text-red-500 dark:hover:bg-gray-700 dark:focus:ring-red-900"
                      >
                        {t('Archive')}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
