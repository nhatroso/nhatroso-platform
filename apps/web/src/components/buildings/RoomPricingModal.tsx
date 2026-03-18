import * as React from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Room, Service, PriceRule } from '@nhatroso/shared';
import { servicesApi } from '@/services/api/services';
import { priceRulesApi } from '@/services/api/price-rules';

interface RoomPricingModalProps {
  room: Room;
  onClose: () => void;
}

export function RoomPricingModal({ room, onClose }: RoomPricingModalProps) {
  const t = useTranslations('Buildings');
  const tServices = useTranslations('Services');
  const format = useFormatter();

  const [services, setServices] = React.useState<Service[]>([]);
  const [rules, setRules] = React.useState<PriceRule[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [selectedServiceId, setSelectedServiceId] = React.useState<
    string | null
  >(null);
  const [unitPrice, setUnitPrice] = React.useState('');
  const [effectiveStart, setEffectiveStart] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allServices, allRules] = await Promise.all([
        servicesApi.list(),
        priceRulesApi.listByRoom(room.id),
      ]);
      setServices(allServices.filter((s) => s.status === 'ACTIVE'));
      setRules(allRules);

      const activeServices = allServices.filter((s) => s.status === 'ACTIVE');
      if (activeServices.length > 0 && !selectedServiceId) {
        setSelectedServiceId(activeServices[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !unitPrice || !effectiveStart) return;

    setErrorMsg('');
    setIsSaving(true);

    try {
      await priceRulesApi.create(room.id, {
        service_id: selectedServiceId,
        unit_price: Number(unitPrice),
        effective_start: effectiveStart,
      });
      setUnitPrice('');
      setEffectiveStart('');
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to create price rule',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const currentRules = rules.filter((r) => r.service_id === selectedServiceId);
  const activeService = services.find((s) => s.id === selectedServiceId);
  const unit = activeService?.unit || 'unit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="flex h-full max-h-[700px] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('Pricing')} — {room.room_code}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Services */}
          <div className="w-1/3 overflow-y-auto border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
              </div>
            ) : services.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {tServices('NoActiveServices')}
              </div>
            ) : (
              <ul>
                {services.map((s) => {
                  const isActive = s.id === selectedServiceId;
                  return (
                    <li
                      key={s.id}
                      className="border-b border-gray-200 last:border-0 dark:border-gray-700"
                    >
                      <button
                        onClick={() => {
                          setSelectedServiceId(s.id);
                          setErrorMsg('');
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-gray-700 dark:text-blue-400'
                            : 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                        }`}
                      >
                        {s.name}{' '}
                        <span className="text-xs text-gray-400">({s.unit})</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Right: Rules & Form */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6 dark:bg-gray-800">
            {!selectedServiceId ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                {tServices('SelectAService')}
              </div>
            ) : (
              <div className="flex h-full flex-col gap-6">
                {/* Create Rule Form */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">
                    {tServices('SetNewPrice')}
                  </h3>
                  {errorMsg && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-gray-800 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}
                  <form onSubmit={handleCreateRule} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        {tServices('UnitPrice')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder={tServices('PlaceholderPrice')}
                        className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        {tServices('EffectiveFrom')}
                      </label>
                      <input
                        type="date"
                        value={effectiveStart}
                        onChange={(e) => setEffectiveStart(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      {isSaving ? '...' : tServices('AddPriceRule')}
                    </button>
                  </form>
                </div>

                {/* Price History Table */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                    {tServices('PriceHistory')}
                  </h3>
                  {currentRules.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {tServices('NoRulesConfigured')}
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th className="px-4 py-3">{tServices('Price')}</th>
                            <th className="px-4 py-3">{tServices('StartDate')}</th>
                            <th className="px-4 py-3">{tServices('EndDate')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {currentRules.map((rule, idx) => (
                            <tr
                              key={rule.id}
                              className={`${
                                idx === 0 && !rule.effective_end
                                  ? 'bg-green-50 dark:bg-green-900/20'
                                  : 'bg-white dark:bg-gray-800'
                              }`}
                            >
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                                {rule.unit_price} / {unit}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                {format.dateTime(new Date(rule.effective_start), {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                {rule.effective_end
                                  ? format.dateTime(
                                      new Date(rule.effective_end),
                                      {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      },
                                    )
                                  : tServices('NoEndDate')}
                              </td>
                            </tr>
                          ))}
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
