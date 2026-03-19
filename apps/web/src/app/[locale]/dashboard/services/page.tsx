'use client';

import * as React from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Service, PriceRule } from '@nhatroso/shared';
import { servicesApi } from '@/services/api/services';
import { priceRulesApi } from '@/services/api/price-rules';

export default function ServicesPage() {
  const t = useTranslations('Services');
  const format = useFormatter();

  const [services, setServices] = React.useState<Service[]>([]);
  const [defaultRules, setDefaultRules] = React.useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const [name, setName] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  // Default Pricing Form
  const [defaultPrice, setDefaultPrice] = React.useState('');
  const [effectiveStart, setEffectiveStart] = React.useState(new Date().toISOString().split('T')[0]);
  const [isSavingDefault, setIsSavingDefault] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [srvs, rules] = await Promise.all([
        servicesApi.list(),
        priceRulesApi.listDefaults(),
      ]);
      setServices(srvs);
      setDefaultRules(rules);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  const currentDefaultRules = React.useMemo(
    () => defaultRules
      .filter((r) => r.service_id === selectedServiceId)
      .sort((a, b) => new Date(b.effective_start).getTime() - new Date(a.effective_start).getTime()),
    [defaultRules, selectedServiceId]
  );

  React.useEffect(() => {
    if (selectedService) {
      setName(selectedService.name);
      setUnit(selectedService.unit);
      setErrorMsg('');
      setDefaultPrice('');
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
    setEditingDefaultRuleId(null);
  };

  const [editingDefaultRuleId, setEditingDefaultRuleId] = React.useState<string | null>(null);

  const handleSaveService = async (e: React.FormEvent) => {
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
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('ErrorDuplicate'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDefaultPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !defaultPrice || !effectiveStart) return;

    setIsSavingDefault(true);
    try {
      if (editingDefaultRuleId) {
        await priceRulesApi.update(editingDefaultRuleId, {
          unit_price: Number(defaultPrice),
          effective_start: effectiveStart,
        });
      } else {
        await priceRulesApi.create({
          service_id: selectedServiceId,
          unit_price: Number(defaultPrice),
          effective_start: effectiveStart,
        });
      }
      setDefaultPrice('');
      setEditingDefaultRuleId(null);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save default price');
    } finally {
      setIsSavingDefault(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedServiceId) return;
    if (!confirm(t('ConfirmArchive'))) return;
    try {
      await servicesApi.archive(selectedServiceId);
      setSelectedServiceId(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to archive', err);
    }
  };

  const handleQuickAdd = async (name: string, unit: string, price: number) => {
     try {
       setIsLoading(true);
       const srv = await servicesApi.create({ name, unit });
       await priceRulesApi.create({
         service_id: srv.id,
         unit_price: price,
         effective_start: new Date().toISOString().split('T')[0],
       });
       await fetchData();
       setSelectedServiceId(srv.id);
     } catch (err) {
       console.error('Quick add failed', err);
       alert('Quick add failed');
     } finally {
       setIsLoading(false);
     }
  };

  const commonServices = [
    { name: 'Điện (Electricity)', unit: 'kWh', price: 3500 },
    { name: 'Nước (Water)', unit: 'm3', price: 20000 },
    { name: 'Internet', unit: 'Tháng (Month)', price: 100000 },
    { name: 'Rác (Trash)', unit: 'Tháng (Month)', price: 30000 },
  ];

  return (
    <div className="flex h-[calc(100vh-112px)] w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Sidebar: Service List */}
      <div className={`flex flex-col border-r border-gray-100 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-900/20 transition-all duration-300 ${
          selectedServiceId || isCreating
            ? 'hidden w-full md:flex md:w-[320px]'
            : 'flex w-full md:w-[320px]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {t('Title')}
          </h1>
          <button
            onClick={handleCreateNew}
            className="rounded-xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
            title={t('CreateNew') || 'Create New'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading && services.length === 0 ? (
            <div className="space-y-3 p-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-6">
                {t('Empty')}
              </p>
              
              <div className="w-full space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Setup</span>
                {commonServices.map(cs => (
                  <button
                    key={cs.name}
                    onClick={() => handleQuickAdd(cs.name.split(' (')[0], cs.unit, cs.price)}
                    className="w-full rounded-xl border border-gray-100 bg-white p-3 text-left text-xs font-bold text-gray-700 shadow-sm hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-all"
                  >
                    + {cs.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="px-3 py-2">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">All Services</span>
              </div>
              {services.map((srv) => {
                const isSelected = srv.id === selectedServiceId;
                const hasDefaultPrice = defaultRules.some(r => r.service_id === srv.id && !r.effective_end);
                
                return (
                  <button
                    key={srv.id}
                    onClick={() => handleSelectService(srv.id)}
                    className={`group w-full rounded-2xl px-4 py-4 text-left transition-all ${
                      isSelected
                        ? 'bg-white shadow-xl shadow-gray-200/50 ring-1 ring-gray-100 dark:bg-gray-800 dark:shadow-none dark:ring-gray-700'
                        : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`truncate text-sm font-black ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : srv.status === 'ARCHIVED'
                            ? 'text-gray-300 line-through'
                            : 'text-gray-700 dark:text-gray-200'
                      }`}>
                        {srv.name}
                      </h3>
                      {hasDefaultPrice && (
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-gray-400">{srv.unit}</span>
                       {isSelected && srv.status === 'ACTIVE' && (
                         <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Editing</span>
                       )}
                    </div>
                  </button>
                );
              })}
              
              <div className="mt-8 px-3 py-2">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Common Setup</span>
              </div>
              <div className="px-1 space-y-1">
                {commonServices.filter(cs => !services.some(s => s.name.startsWith(cs.name.split(' (')[0]))).map(cs => (
                  <button
                    key={cs.name}
                    onClick={() => handleQuickAdd(cs.name.split(' (')[0], cs.unit, cs.price)}
                    className="w-full rounded-xl border border-gray-100 bg-white p-3 text-left text-xs font-bold text-gray-600 shadow-sm hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition-all"
                  >
                    + {cs.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/30 p-8 ${
          selectedServiceId || isCreating ? 'flex' : 'hidden md:flex'
        }`}
      >
        {!selectedServiceId && !isCreating ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
             <div className="mb-6 rounded-3xl bg-white p-8 shadow-2xl shadow-gray-200/50 dark:bg-gray-800 dark:shadow-none">
                <svg className="h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.282a2 2 0 01-1.806 0l-.628-.282a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-.348.348a2 2 0 000 2.828l.793.793a2 2 0 002.828 0l.793-.793a2 2 0 012.828 0l.793.793a2 2 0 002.828 0l.793-.793a2 2 0 012.828 0l.793.793a2 2 0 002.828 0l.348-.348a2 2 0 000-2.828l-.793-.793z" />
                </svg>
             </div>
             <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('SelectFirst')}</h2>
             <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Select a service or create a new one to start configuring prices.</p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Back button (mobile) */}
             <button
                onClick={() => { setIsCreating(false); setSelectedServiceId(null); }}
                className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 md:hidden dark:hover:text-white"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to List
              </button>

             {/* Top: Service Basic Info */}
             <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/30 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-8 flex items-center justify-between">
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        {isCreating ? 'Create Service' : selectedService?.name}
                      </h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Basic Configuration
                      </p>
                   </div>
                   {!isCreating && selectedService?.status !== 'ARCHIVED' && (
                     <button
                        onClick={handleArchive}
                        className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 transition-all"
                      >
                        Archive Service
                      </button>
                   )}
                </div>

                <form onSubmit={handleSaveService} className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                   {errorMsg && (
                    <div className="sm:col-span-2 rounded-2xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Electricity, Water"
                      disabled={isSaving || selectedService?.status === 'ARCHIVED'}
                      className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-900 outline-none ring-blue-500 transition-all focus:border-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Pricing Unit</label>
                    <input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. kWh, m3, Month"
                      disabled={isSaving || selectedService?.status === 'ARCHIVED'}
                      className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-900 outline-none ring-blue-500 transition-all focus:border-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  {(isCreating || selectedService?.status === 'ACTIVE') && (
                    <div className="sm:col-span-2">
                       <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full rounded-2xl bg-gray-900 py-4 text-sm font-black text-white hover:bg-black focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all active:scale-[0.99]"
                      >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  )}
                </form>
             </div>

             {/* Bottom: Default Pricing (only for existing services) */}
             {!isCreating && selectedService?.status === 'ACTIVE' && (
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
                   {/* Left: Set Default Form */}
                   <div className="lg:col-span-2 space-y-6">
                      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/30 dark:border-gray-700 dark:bg-gray-800">
                         <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">
                            {editingDefaultRuleId ? 'Edit Default Price' : 'Set Default Price'}
                         </h3>
                         
                         <form onSubmit={handleSaveDefaultPrice} className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Default Price</label>
                              <input
                                type="number"
                                value={defaultPrice}
                                onChange={(e) => setDefaultPrice(e.target.value)}
                                placeholder="e.g. 3500"
                                className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-900 outline-none ring-blue-500 transition-all focus:border-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Effective From</label>
                              <input
                                type="date"
                                value={effectiveStart}
                                onChange={(e) => setEffectiveStart(e.target.value)}
                                className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold text-gray-900 outline-none ring-blue-500 transition-all focus:border-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isSavingDefault}
                              className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                              {isSavingDefault ? '...' : editingDefaultRuleId ? 'Update Default' : 'Enable Default Price'}
                            </button>
                            
                            {editingDefaultRuleId && (
                              <button
                                type="button"
                                onClick={() => { setEditingDefaultRuleId(null); setDefaultPrice(''); }}
                                className="w-full text-xs font-bold text-gray-400 uppercase hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            )}
                         </form>
                      </div>
                      
                      <div className="bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-2xl p-6">
                         <div className="flex items-start gap-4">
                            <div className="rounded-full bg-teal-500/10 p-2">
                               <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                            </div>
                            <p className="text-xs leading-relaxed text-teal-800 dark:text-teal-400">
                               <strong>Default Price</strong> will be applied to all rooms in all buildings that do not have a specific price rule for this service.
                            </p>
                         </div>
                      </div>
                   </div>

                   {/* Right: Default History */}
                   <div className="lg:col-span-3 space-y-6">
                      <div className="rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/30 dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                         <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Default Price History</h3>
                         </div>
                         
                         {currentDefaultRules.length === 0 ? (
                           <div className="p-12 text-center">
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No default pricing rules defined for this service.</p>
                           </div>
                         ) : (
                           <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                 <thead className="bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:bg-gray-900/50">
                                    <tr>
                                       <th className="px-8 py-4">Price / {unit}</th>
                                       <th className="px-8 py-4">Effective From</th>
                                       <th className="px-8 py-4">Status</th>
                                       <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {currentDefaultRules.map((rule) => {
                                      const isCurrent = !rule.effective_end;
                                      const isFuture = new Date(rule.effective_start) > new Date();
                                      
                                      return (
                                        <tr key={rule.id} className={`${isCurrent ? 'bg-blue-50/10' : ''}`}>
                                           <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">
                                              {rule.unit_price}
                                           </td>
                                           <td className="px-8 py-5 text-gray-500 dark:text-gray-400">
                                              {format.dateTime(new Date(rule.effective_start), { dateStyle: 'medium' })}
                                           </td>
                                           <td className="px-8 py-5">
                                              {isCurrent ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-tighter">Active Now</span>
                                              ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-400 dark:bg-gray-800 uppercase tracking-tighter">Expired</span>
                                              )}
                                           </td>
                                           <td className="px-8 py-5 text-right">
                                              {isFuture ? (
                                                <div className="flex justify-end gap-2">
                                                   <button
                                                      onClick={() => { setEditingDefaultRuleId(rule.id); setDefaultPrice(String(rule.unit_price)); setEffectiveStart(rule.effective_start); }}
                                                      className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase"
                                                    >
                                                      Edit
                                                    </button>
                                                   <button
                                                      onClick={async () => { if(confirm('Delete?')) { await priceRulesApi.remove(rule.id); fetchData(); } }}
                                                      className="text-red-500 hover:text-red-700 font-bold text-xs uppercase"
                                                    >
                                                      Delete
                                                    </button>
                                                </div>
                                              ) : (
                                                <span className="text-[10px] font-bold text-gray-300 uppercase italic">Locked</span>
                                              )}
                                           </td>
                                        </tr>
                                      );
                                    })}
                                 </tbody>
                              </table>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
