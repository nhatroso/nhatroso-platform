import * as React from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Room, Service, PriceRule } from '@nhatroso/shared';
import { servicesApi } from '@/services/api/services';
import { priceRulesApi } from '@/services/api/price-rules';

interface RoomPricingModalProps {
  room: Room;
  buildingId: string;
  onClose: () => void;
}

export function RoomPricingModal({
  room,
  buildingId,
  onClose,
}: RoomPricingModalProps) {
  const t = useTranslations('Buildings');
  const tServices = useTranslations('Services');
  const format = useFormatter();

  const [services, setServices] = React.useState<Service[]>([]);
  const [roomRules, setRoomRules] = React.useState<PriceRule[]>([]);
  const [buildingRules, setBuildingRules] = React.useState<PriceRule[]>([]);
  const [defaultRules, setDefaultRules] = React.useState<PriceRule[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [selectedServiceId, setSelectedServiceId] = React.useState<
    string | null
  >(null);
  const [unitPrice, setUnitPrice] = React.useState('');
  const [effectiveStart, setEffectiveStart] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  // For Editing
  const [editingRuleId, setEditingRuleId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, buildingId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allServices, rRules, bRules, dRules] = await Promise.all([
        servicesApi.list(),
        priceRulesApi.listByRoom(room.id),
        priceRulesApi.listByBuilding(buildingId),
        priceRulesApi.listDefaults(),
      ]);

      const activeServices = allServices.filter((s) => s.status === 'ACTIVE');
      setServices(activeServices);
      setRoomRules(rRules);
      setBuildingRules(bRules);
      setDefaultRules(dRules);

      if (activeServices.length > 0 && !selectedServiceId) {
        setSelectedServiceId(activeServices[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !unitPrice || !effectiveStart) return;

    setErrorMsg('');
    setIsSaving(true);

    try {
      if (editingRuleId) {
        await priceRulesApi.update(editingRuleId, {
          unit_price: Number(unitPrice),
          effective_start: effectiveStart,
        });
      } else {
        await priceRulesApi.create({
          room_id: room.id,
          building_id: buildingId,
          service_id: selectedServiceId,
          unit_price: Number(unitPrice),
          effective_start: effectiveStart,
        });
      }
      setUnitPrice('');
      setEffectiveStart('');
      setEditingRuleId(null);
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to save price rule',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (rule: PriceRule) => {
    setEditingRuleId(rule.id);
    setUnitPrice(rule.unit_price);
    setEffectiveStart(rule.effective_start);
    setErrorMsg('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tServices('ConfirmDeletePriceRule'))) return;
    try {
      await priceRulesApi.remove(id);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const cancelEdit = () => {
    setEditingRuleId(null);
    setUnitPrice('');
    setEffectiveStart('');
    setErrorMsg('');
  };

  // Logic to determine inherited price
  const activeService = services.find((s) => s.id === selectedServiceId);
  const unit = activeService?.unit || 'unit';

  const currentRoomRules = roomRules
    .filter((r) => r.service_id === selectedServiceId)
    .sort(
      (a, b) =>
        new Date(b.effective_start).getTime() -
        new Date(a.effective_start).getTime(),
    );

  const activeRoomRule = currentRoomRules.find((r) => !r.effective_end);

  const activeBuildingRule = buildingRules.find(
    (r) => r.service_id === selectedServiceId && !r.effective_end,
  );

  const activeDefaultRule = defaultRules.find(
    (r) => r.service_id === selectedServiceId && !r.effective_end,
  );

  const inheritedRule = activeBuildingRule || activeDefaultRule;
  const isInherited = !activeRoomRule && !!inheritedRule;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[750px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('Pricing')} — {room.code}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tServices('ManagePricingForThisRoom')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Services Navigation */}
          <div className="w-1/4 min-w-[200px] overflow-y-auto border-r border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/30">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                {tServices('NoActiveServices')}
              </div>
            ) : (
              <nav className="p-2 space-y-1">
                {services.map((s) => {
                  const isActive = s.id === selectedServiceId;
                  const hasCustomRule = roomRules.some(r => r.service_id === s.id && !r.effective_end);
                  
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedServiceId(s.id);
                        setErrorMsg('');
                        setEditingRuleId(null);
                        setUnitPrice('');
                        setEffectiveStart('');
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-gray-600 hover:bg-white hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{s.name}</span>
                        <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                          {s.unit}
                        </span>
                      </div>
                      {hasCustomRule && !isActive && (
                        <div className="h-2 w-2 rounded-full bg-teal-500" />
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Content Area */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-white p-8 dark:bg-gray-800">
            {!selectedServiceId ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-700">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {tServices('SelectAServiceToManagePricing')}
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Current Active Price (Inherited or Custom) */}
                <div className="flex items-start justify-between rounded-2xl border border-gray-100 bg-blue-50/50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {tServices('CurrentActivePrice')}
                    </span>
                    <div className="mt-1 flex items-baseline gap-2">
                       <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                         {(activeRoomRule || inheritedRule)?.unit_price || '0'}
                       </h3>
                       <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                         / {unit}
                       </span>
                    </div>
                    {isInherited && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {activeBuildingRule ? tServices('InheritedFromBuilding') : tServices('InheritedFromDefault')}
                      </div>
                    )}
                  </div>
                  
                  {!isInherited && activeRoomRule && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Effective Since</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {format.dateTime(new Date(activeRoomRule.effective_start), { dateStyle: 'medium' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Create/Edit Form */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/50">
                  <h3 className="mb-6 text-sm font-bold text-gray-900 dark:text-white">
                    {editingRuleId ? tServices('EditPriceRule') : tServices('SetCustomPrice')}
                  </h3>
                  
                  {errorMsg && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                      <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveRule} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">
                        {tServices('UnitPrice')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder="e.g. 3500"
                          className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-4 pl-4 text-sm font-medium text-gray-900 outline-none ring-blue-500 transition-all focus:border-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">
                        {tServices('EffectiveFrom')}
                      </label>
                      <input
                        type="date"
                        value={effectiveStart}
                        onChange={(e) => setEffectiveStart(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-900 outline-none ring-blue-500 transition-all focus:border-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        required
                        min={editingRuleId ? undefined : todayStr}
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 rounded-xl bg-gray-900 px-6 py-4 text-sm font-bold text-white hover:bg-black focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all active:scale-[0.98]"
                      >
                        {isSaving ? '...' : editingRuleId ? tServices('UpdatePrice') : tServices('ApplyCustomPrice')}
                      </button>
                      
                      {editingRuleId && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-all"
                        >
                          {tServices('Cancel')}
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Price History */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {tServices('PriceHistory')}
                    </h3>
                  </div>

                  {currentRoomRules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                        {tServices('NoCustomRulesForThisRoom')}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm dark:border-gray-700">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                          <tr>
                            <th className="px-6 py-4">{tServices('Price')}</th>
                            <th className="px-6 py-4">{tServices('StartDate')}</th>
                            <th className="px-6 py-4">{tServices('EndDate')}</th>
                            <th className="px-6 py-4 text-right">{tServices('Actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                          {currentRoomRules.map((rule) => {
                            const isEditable = new Date(rule.effective_start) > new Date();
                            const isCurrent = !rule.effective_end;

                            return (
                              <tr
                                key={rule.id}
                                className={`group transition-colors ${
                                  isCurrent ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'bg-white dark:bg-gray-800'
                                } hover:bg-gray-50 dark:hover:bg-gray-700/30`}
                              >
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                  {rule.unit_price}
                                  <span className="ml-1 text-[10px] font-medium text-gray-400">/ {unit}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                  {format.dateTime(new Date(rule.effective_start), { dateStyle: 'medium' })}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-500 font-medium">
                                  {rule.effective_end
                                    ? format.dateTime(new Date(rule.effective_end), { dateStyle: 'medium' })
                                    : <span className="text-teal-600 dark:text-teal-400 font-bold">{tServices('Active')}</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {isEditable ? (
                                      <>
                                        <button
                                          onClick={() => handleEdit(rule)}
                                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                                          title={tServices('Edit') || 'Edit'}
                                        >
                                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDelete(rule.id)}
                                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                                          title={tServices('Delete') || 'Delete'}
                                        >
                                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-[10px] font-bold text-gray-300 uppercase select-none">Locked</span>
                                    )}
                                  </div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
