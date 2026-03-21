'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Service, PriceRule } from '@nhatroso/shared';
import { servicesApi } from '@/services/api/services';
import { priceRulesApi } from '@/services/api/price-rules';

const PREDEFINED_SERVICES = [
  { id_key: 'electricity', name: 'Điện (Electricity)', unit: 'kWh' },
  { id_key: 'water', name: 'Nước (Water)', unit: 'm3' },
  { id_key: 'internet', name: 'Internet', unit: 'Tháng' },
  { id_key: 'trash', name: 'Rác (Trash)', unit: 'Tháng' },
  { id_key: 'management', name: 'Phí dịch vụ chung', unit: 'Tháng' },
  { id_key: 'parking_moto', name: 'Gửi xe máy', unit: 'Tháng' },
  { id_key: 'parking_car', name: 'Gửi ô tô', unit: 'Tháng' },
];

export default function ServicesPage() {
  const t = useTranslations('Services');

  const [services, setServices] = React.useState<Service[]>([]);
  const [serviceRules, setServiceRules] = React.useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedServiceId, setSelectedServiceId] = React.useState<
    string | null
  >(null);

  // Template Form
  const [templateName, setTemplateName] = React.useState('Standard Price');
  const [templatePrice, setTemplatePrice] = React.useState('');
  const [isSavingTemplate, setIsSavingTemplate] = React.useState(false);
  const [editingRuleId, setEditingRuleId] = React.useState<string | null>(null);
  const [quickAddData, setQuickAddData] = React.useState<{
    name: string;
    unit: string;
  } | null>(null);
  const [quickAddPrice, setQuickAddPrice] = React.useState('');

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const srvs = await servicesApi.list();
      setServices(srvs);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRulesForService = React.useCallback(async (serviceId: string) => {
    try {
      const rules = await priceRulesApi.listByService(serviceId);
      // Sort alphabetically by name
      setServiceRules(rules.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to fetch service rules', err);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  React.useEffect(() => {
    if (selectedServiceId) {
      fetchRulesForService(selectedServiceId);
      setTemplatePrice('');
      setTemplateName('Standard Price');
      setEditingRuleId(null);
    } else {
      setServiceRules([]);
    }
  }, [selectedServiceId, fetchRulesForService]);

  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !templatePrice || !templateName) return;

    setIsSavingTemplate(true);
    try {
      if (editingRuleId) {
        await priceRulesApi.update(editingRuleId, {
          unit_price: Number(templatePrice),
          name: templateName,
        });
      } else {
        await priceRulesApi.create({
          service_id: selectedServiceId,
          unit_price: Number(templatePrice),
          name: templateName,
        });
      }
      setTemplatePrice('');
      setTemplateName('Standard Price');
      setEditingRuleId(null);
      await fetchRulesForService(selectedServiceId);
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : 'Failed to save price template',
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedServiceId) return;
    if (
      !confirm(
        t('ConfirmArchive') || 'Are you sure you want to disable this service?',
      )
    )
      return;
    try {
      await servicesApi.archive(selectedServiceId);
      setSelectedServiceId(null);
      await fetchServices();
    } catch (err) {
      console.error('Failed to archive', err);
    }
  };

  const handleQuickAdd = (name: string, unit: string) => {
    setQuickAddData({ name, unit });
    setQuickAddPrice('');
    setSelectedServiceId(null);
  };

  const handleConfirmQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddData || !quickAddPrice) return;

    try {
      setIsLoading(true);
      const srv = await servicesApi.create({
        name: quickAddData.name,
        unit: quickAddData.unit,
      });

      // Create initial price rule
      await priceRulesApi.create({
        service_id: srv.id,
        unit_price: Number(quickAddPrice),
        name: 'Standard Price',
      });

      setQuickAddData(null);
      setQuickAddPrice('');
      await fetchServices();
      setSelectedServiceId(srv.id);
    } catch (err: unknown) {
      console.error('Quick add failed', err);
      alert(
        err instanceof Error ? err.message : 'Failed to add predefined service',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeServices = React.useMemo(() => {
    return services.filter((s) => s.status === 'ACTIVE');
  }, [services]);

  const availablePredefined = React.useMemo(() => {
    return PREDEFINED_SERVICES.filter((ps) => {
      const existing = services.find((s) => s.name === ps.name);
      return !existing || existing.status === 'ARCHIVED';
    });
  }, [services]);

  return (
    <div className="flex h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Sidebar: Service List */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 ${
          selectedServiceId
            ? 'hidden w-full md:flex md:w-[320px] lg:w-[360px]'
            : 'flex w-full md:w-[320px] lg:w-[360px]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('Title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeServices.length} active services
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 p-4">
          {isLoading && services.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeServices.length > 0 && (
                <li className="px-1 pt-1 pb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Active Services
                  </span>
                </li>
              )}

              {activeServices.map((srv) => {
                const isSelected = srv.id === selectedServiceId;

                return (
                  <li key={srv.id}>
                    <button
                      onClick={() => handleSelectService(srv.id)}
                      className={`w-full rounded-lg px-4 py-3 text-left transition-all duration-200 border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 dark:bg-blue-900/30 dark:border-blue-500 shadow-sm'
                          : 'bg-white border-transparent hover:border-gray-300 hover:shadow-sm dark:bg-gray-800 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`truncate text-sm font-semibold ${
                              isSelected
                                ? 'text-blue-800 dark:text-blue-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {srv.name}
                          </h3>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                              Unit: {srv.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}

              {availablePredefined.length > 0 && (
                <>
                  <li className="px-1 pt-6 pb-2 border-t border-gray-200 mt-2 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Add Predefined Service
                    </span>
                  </li>
                  <div className="space-y-2">
                    {availablePredefined.map((ps) => (
                      <button
                        key={ps.id_key}
                        onClick={() => handleQuickAdd(ps.name, ps.unit)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition-colors flex justify-between items-center"
                      >
                        <span>{ps.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 rounded-full dark:bg-gray-700">
                          /{ps.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 ${selectedServiceId || quickAddData ? 'flex' : 'hidden md:flex'}`}
      >
        {!selectedServiceId && !quickAddData ? (
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
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.282a2 2 0 01-1.806 0l-.628-.282a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-.348.348a2 2 0 000 2.828l.793.793a2 2 0 002.828 0l.793-.793a2 2 0 012.828 0l.793.793a2 2 0 002.828 0l.348-.348a2 2 0 000-2.828l-.793-.793z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('SelectFirst')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Select a predefined service from the list on the left to start
                configuring price templates.
              </p>
            </div>
          </div>
        ) : quickAddData ? (
          <div className="w-full p-6 max-w-2xl mx-auto flex items-center justify-center h-full">
            <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
              <div className="bg-blue-600 px-6 py-8 text-white">
                <h3 className="text-2xl font-bold">Add {quickAddData.name}</h3>
                <p className="mt-2 text-blue-100 italic">
                  Please set an initial standard price to enable this service.
                </p>
              </div>

              <form onSubmit={handleConfirmQuickAdd} className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      Pricing Unit
                    </label>
                    <div className="bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-xl block w-full p-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 font-medium">
                      {quickAddData.unit}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      Initial Price (VND/{quickAddData.unit})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quickAddPrice}
                        onChange={(e) => setQuickAddPrice(e.target.value)}
                        placeholder="e.g. 3500"
                        className="bg-white border-2 border-gray-200 text-gray-900 text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-4 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 shadow-sm"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-10">
                  <button
                    type="button"
                    onClick={() => setQuickAddData(null)}
                    className="py-3 px-6 text-sm font-bold text-gray-600 hover:text-gray-900 focus:outline-none bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-bold rounded-xl text-sm px-8 py-3 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Enable Service & Save Price'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="w-full p-6 max-w-5xl mx-auto">
            {/* Back button (mobile) */}
            <button
              onClick={() => setSelectedServiceId(null)}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 md:hidden dark:hover:text-white"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to List
            </button>

            <div className="grid grid-cols-1 gap-6">
              {/* Top: Service Basic Info (Read-Only) */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedService?.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Basic Predefined Service
                    </p>
                  </div>
                  {selectedService?.status !== 'ARCHIVED' && (
                    <button
                      onClick={handleArchive}
                      className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
                    >
                      Disable Service
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Service Name
                      </label>
                      <div className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white opacity-70">
                        {selectedService?.name}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Pricing Unit
                      </label>
                      <div className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white opacity-70">
                        {selectedService?.unit}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
                    Predefined services cannot be renamed or have their unit
                    changed. To stop using this service, click &quot;Disable
                    Service&quot;.
                  </p>
                </div>
              </div>

              {/* Bottom: Price Templates */}
              {selectedService?.status === 'ACTIVE' && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingRuleId
                          ? 'Edit Price Template'
                          : 'Create Price Template'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Define price templates which can be applied to different
                        rooms or properties.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSaveTemplate}
                    className="p-6 border-b border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Template Name
                        </label>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g. Standard Price"
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 shadow-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Unit Price (VND/{selectedService.unit})
                        </label>
                        <input
                          type="number"
                          value={templatePrice}
                          onChange={(e) => setTemplatePrice(e.target.value)}
                          placeholder="e.g. 3500"
                          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      {editingRuleId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRuleId(null);
                            setTemplatePrice('');
                            setTemplateName('Standard Price');
                          }}
                          className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingTemplate}
                        className="text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-teal-600 dark:hover:bg-teal-700 focus:outline-none dark:focus:ring-teal-800 disabled:opacity-50"
                      >
                        {isSavingTemplate
                          ? '...'
                          : editingRuleId
                            ? 'Update Template'
                            : 'Create Template'}
                      </button>
                    </div>
                  </form>

                  <div className="p-0 overflow-x-auto">
                    {serviceRules.length === 0 ? (
                      <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No price templates defined yet.
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th scope="col" className="px-6 py-4">
                              Template Name
                            </th>
                            <th scope="col" className="px-6 py-4">
                              Price
                            </th>
                            <th scope="col" className="px-6 py-4 text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceRules.map((rule) => {
                            return (
                              <tr
                                key={rule.id}
                                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                              >
                                <td className="px-6 py-5 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                  {rule.name}
                                </td>
                                <td className="px-6 py-5 text-gray-900 dark:text-white">
                                  {rule.unit_price} /{selectedService.unit}
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => {
                                        setEditingRuleId(rule.id);
                                        setTemplatePrice(
                                          String(rule.unit_price),
                                        );
                                        setTemplateName(rule.name);
                                      }}
                                      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (
                                          confirm(
                                            'Delete this template? Note: This might affect rooms currently using this template.',
                                          )
                                        ) {
                                          await priceRulesApi.remove(rule.id);
                                          fetchRulesForService(
                                            selectedService.id,
                                          );
                                        }
                                      }}
                                      className="font-medium text-red-600 dark:text-red-500 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
