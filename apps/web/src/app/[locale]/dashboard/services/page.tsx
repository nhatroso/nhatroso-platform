'use client';

import { useTranslations } from 'next-intl';
import { useServices } from '@/hooks/use-services';
import { getServiceDisplayName, getUnitDisplayName } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ServicesPage() {
  const t = useTranslations('Services');
  const {
    services,
    serviceRules,
    isLoading,
    selectedServiceId,
    selectedService,
    activeServices,
    availablePredefined,
    templateName,
    templatePrice,
    isSavingTemplate,
    editingRuleId,
    setTemplateName,
    setTemplatePrice,
    setEditingRuleId,
    quickAddData,
    quickAddPrice,
    predefinedSearch,
    setQuickAddData,
    setQuickAddPrice,
    setPredefinedSearch,
    handleSelectService,
    handleSaveTemplate,
    handleArchive,
    handleQuickAdd,
    handleConfirmQuickAdd,
    handleRemoveRule,
    startEditRule,
    setSelectedServiceId,
  } = useServices();

  return (
    <div className="flex h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-gray-border bg-gray-card shadow-sm">
      {/* Sidebar: Service List */}
      <div
        className={`flex flex-col border-r border-gray-border bg-gray-card transition-all duration-300 ${
          selectedServiceId
            ? 'hidden w-full md:flex md:w-[320px] lg:w-[360px]'
            : 'flex w-full md:w-[320px] lg:w-[360px]'
        }`}
      >
        <PageHeader
          variant="split"
          title={t('Title')}
          description={t('ActiveServicesCount', {
            count: activeServices.length,
          })}
        />

        <div className="flex-1 overflow-y-auto bg-gray-surface/50 p-4">
          {isLoading && services.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-border border-t-primary" />
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeServices.length > 0 && (
                <li className="px-1 pt-1 pb-2">
                  <span className="text-tiny font-semibold text-gray-muted uppercase tracking-wider">
                    {t('Active')}
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
                          ? 'bg-primary-light border-primary shadow-sm'
                          : 'bg-gray-card border-transparent hover:border-gray-border hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`truncate text-body font-semibold ${
                              isSelected ? 'text-primary' : 'text-gray-text'
                            }`}
                          >
                            {getServiceDisplayName(srv.name, t)}
                          </h3>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="truncate text-tiny text-gray-muted">
                              {t('UnitLabel')}:{' '}
                              {getUnitDisplayName(srv.unit, t)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}

              {availablePredefined.length > 0 || predefinedSearch ? (
                <>
                  <li className="px-1 pt-6 pb-2 border-t border-gray-border mt-2">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-tiny font-semibold text-gray-muted uppercase tracking-wider">
                          {t('AddPredefinedService')}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-muted"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                            />
                          </svg>
                        </div>
                        <input
                          type="search"
                          value={predefinedSearch}
                          onChange={(e) => setPredefinedSearch(e.target.value)}
                          className="block w-full p-2 ps-10 text-body text-gray-text border border-gray-border rounded-lg bg-gray-card focus:ring-primary focus:border-primary"
                          placeholder={t('SearchService')}
                        />
                      </div>
                    </div>
                  </li>
                  <div className="space-y-2 mt-2">
                    {availablePredefined.length > 0 ? (
                      availablePredefined.map((ps) => (
                        <button
                          key={ps.id_key}
                          onClick={() => handleQuickAdd(ps.id_key, ps.unit_key)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-card border border-transparent rounded-xl text-body font-medium text-gray-text hover:bg-gray-subtle transition-colors shadow-sm w-full justify-between"
                        >
                          <span>{t('Predefined_' + ps.id_key)}</span>
                          <span className="text-tiny text-gray-muted bg-gray-subtle px-2 rounded-full">
                            /{t('Unit_' + ps.unit_key)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-body text-gray-muted italic">
                        No services found
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </ul>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 overflow-y-auto bg-gray-surface/50 ${selectedServiceId || quickAddData ? 'flex' : 'hidden md:flex'}`}
      >
        {!selectedServiceId && !quickAddData ? (
          <div className="hidden h-full w-full items-center justify-center md:flex">
            <div className="flex flex-col items-center text-center p-8 bg-gray-card rounded-xl shadow-sm border border-gray-border">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary">
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
              <h3 className="text-h2 font-bold text-gray-text">
                {t('SelectFirst')}
              </h3>
              <p className="mt-2 text-body text-gray-muted max-w-sm">
                {t('SelectFirst')}
              </p>
            </div>
          </div>
        ) : quickAddData ? (
          <div className="w-full p-6 max-w-2xl mx-auto flex items-center justify-center h-full">
            <div className="w-full rounded-2xl border border-gray-border bg-gray-card shadow-xl overflow-hidden">
              <div className="bg-primary px-6 py-8 text-white">
                <h3 className="text-h1 font-bold">
                  {t('QuickAddTitle', {
                    name: t('Predefined_' + quickAddData.id_key),
                  })}
                </h3>
                <p className="mt-2 text-primary-light italic">
                  {t('QuickAddDescription')}
                </p>
              </div>

              <form onSubmit={handleConfirmQuickAdd} className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-body font-semibold text-gray-text uppercase tracking-wider">
                      {t('PricingUnit')}
                    </label>
                    <div className="bg-gray-surface border border-gray-border text-gray-muted text-body rounded-xl block w-full p-4 font-medium">
                      {t('Unit_' + quickAddData.unit_key)}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-body font-semibold text-gray-text uppercase tracking-wider">
                      {t('InitialPrice')} (VND/
                      {t('Unit_' + quickAddData.unit_key)})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quickAddPrice}
                        onChange={(e) => setQuickAddPrice(e.target.value)}
                        placeholder="e.g. 3500"
                        className="bg-gray-card border-2 border-gray-border text-gray-text text-body rounded-xl focus:ring-primary focus:border-primary block w-full p-4 shadow-sm"
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
                    className="py-3 px-6 text-body font-bold text-gray-muted hover:text-gray-text focus:outline-none bg-gray-surface rounded-xl hover:bg-gray-border transition-colors"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-primary-light font-bold rounded-xl text-body px-8 py-3 shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? t('Saving') : t('EnableServiceAndSavePrice')}
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
              className="inline-flex items-center text-body font-medium text-gray-muted hover:text-gray-text mb-6 md:hidden"
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
              {t('Back')}
            </button>

            <div className="grid grid-cols-1 gap-6">
              {/* Top: Service Basic Info (Read-Only) */}
              <div className="rounded-xl border border-gray-border bg-gray-card shadow-sm overflow-hidden">
                <div className="border-b border-gray-border bg-gray-surface px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-h3 font-bold text-gray-text">
                      {getServiceDisplayName(selectedService?.name || '', t)}
                    </h3>
                    <p className="mt-1 text-body text-gray-muted">
                      {t('BasicPredefinedService')}
                    </p>
                  </div>
                  {selectedService?.status !== 'ARCHIVED' && (
                    <button
                      onClick={handleArchive}
                      className="text-danger hover:text-white border border-danger hover:bg-danger-hover focus:ring-4 focus:outline-none focus:ring-danger/30 font-medium rounded-lg text-body px-4 py-2 text-center"
                    >
                      {t('DisableService')}
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-2 text-body font-medium text-gray-text">
                        {t('NameLabel')}
                      </label>
                      <div className="bg-gray-surface border border-gray-border text-gray-text text-body rounded-lg block w-full p-2.5 opacity-70">
                        {getServiceDisplayName(selectedService?.name || '', t)}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-body font-medium text-gray-text">
                        {t('PricingUnit')}
                      </label>
                      <div className="bg-gray-surface border border-gray-border text-gray-text text-body rounded-lg block w-full p-2.5 opacity-70">
                        {getUnitDisplayName(selectedService?.unit || '', t)}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-tiny text-gray-muted italic">
                    {t('PredefinedServiceNote')}
                  </p>
                </div>
              </div>

              {/* Bottom: Price Templates */}
              {selectedService?.status === 'ACTIVE' && (
                <div className="rounded-xl border border-gray-border bg-gray-card shadow-sm overflow-hidden">
                  <div className="border-b border-gray-border bg-gray-surface px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-h3 font-bold text-gray-text">
                        {editingRuleId
                          ? t('EditPriceTemplate')
                          : t('CreatePriceTemplate')}
                      </h3>
                      <p className="mt-1 text-body text-gray-muted">
                        {t('DefinePriceTemplatesDescription')}
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSaveTemplate}
                    className="p-6 border-b border-gray-border"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block mb-2 text-body font-medium text-gray-text">
                          {t('TemplateName')}
                        </label>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder={t('PlaceholderName')}
                          className="bg-gray-card border border-gray-border text-gray-text text-body rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 disabled:opacity-50 shadow-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-body font-medium text-gray-text">
                          {t('UnitPrice')} (VND/
                          {getUnitDisplayName(selectedService.unit, t)})
                        </label>
                        <input
                          type="number"
                          value={templatePrice}
                          onChange={(e) => setTemplatePrice(e.target.value)}
                          placeholder={t('PlaceholderPrice')}
                          className="bg-gray-card border border-gray-border text-gray-text text-body rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 disabled:opacity-50 shadow-sm"
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
                            setTemplateName(t('StandardPrice'));
                          }}
                          className="py-2.5 px-5 text-body font-medium text-gray-muted focus:outline-none bg-gray-card rounded-lg border border-gray-border hover:bg-gray-subtle hover:text-gray-text focus:z-10 focus:ring-4 focus:ring-gray-subtle"
                        >
                          {t('Cancel')}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingTemplate}
                        className="text-white bg-success hover:bg-success-hover focus:ring-4 focus:ring-success-light font-medium rounded-lg text-body px-5 py-2.5 disabled:opacity-50"
                      >
                        {isSavingTemplate
                          ? '...'
                          : editingRuleId
                            ? t('Edit')
                            : t('CreateNew')}
                      </button>
                    </div>
                  </form>

                  <div className="p-0 overflow-x-auto">
                    {serviceRules.length === 0 ? (
                      <div className="px-6 py-8 text-center text-body text-gray-muted">
                        {t('NoTemplatesDefined')}
                      </div>
                    ) : (
                      <table className="w-full text-body text-left rtl:text-right text-gray-muted">
                        <thead className="text-tiny text-gray-muted uppercase bg-gray-surface">
                          <tr>
                            <th scope="col" className="px-6 py-4">
                              {t('TemplateName')}
                            </th>
                            <th scope="col" className="px-6 py-4">
                              {t('Price')}
                            </th>
                            <th scope="col" className="px-6 py-4 text-right">
                              {t('Actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceRules.map((rule) => {
                            return (
                              <tr
                                key={rule.id}
                                className="bg-gray-card border-b border-gray-border hover:bg-gray-subtle"
                              >
                                <td className="px-6 py-5 font-medium text-gray-text whitespace-nowrap">
                                  {rule.name}
                                </td>
                                <td className="px-6 py-5 text-gray-text">
                                  {rule.unit_price} /
                                  {getUnitDisplayName(selectedService.unit, t)}
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => startEditRule(rule)}
                                      className="font-medium text-primary hover:underline"
                                    >
                                      {t('Edit')}
                                    </button>
                                    <button
                                      onClick={() => handleRemoveRule(rule.id)}
                                      className="font-medium text-danger hover:underline"
                                    >
                                      {t('Delete')}
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
