import * as React from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  // Form states per service
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

      // select first service by default if any exists
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-full max-h-[800px] w-full max-w-4xl flex-col border-4 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_rgba(24,24,27,1)]">
        <div className="flex items-center justify-between border-b-4 border-zinc-900 bg-zinc-100 p-6">
          <h2 className="text-2xl font-black uppercase tracking-widest">
            {t('Pricing')} - {room.code}
          </h2>
          <Button
            onClick={onClose}
            variant="outline"
            className="h-10 w-10 p-0 rounded-none border-4 border-zinc-900 font-black hover:bg-zinc-200"
          >
            X
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Services */}
          <div className="w-1/3 border-r-4 border-zinc-900 bg-zinc-50 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-xs font-bold uppercase">
                {tServices('Loading')}
              </div>
            ) : services.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold uppercase text-zinc-500">
                {tServices('NoActiveServices')}
              </div>
            ) : (
              <div className="flex flex-col">
                {services.map((s) => {
                  const isActive = s.id === selectedServiceId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedServiceId(s.id);
                        setErrorMsg('');
                      }}
                      className={`border-b-4 border-zinc-900 p-4 text-left font-black uppercase tracking-widest transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'hover:bg-zinc-200'
                      }`}
                    >
                      {s.name}{' '}
                      <span className="text-xs opacity-70">({s.unit})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Rules */}
          <div className="flex-1 flex-col overflow-y-auto p-6 bg-white">
            {!selectedServiceId ? (
              <div className="flex h-full items-center justify-center text-sm font-bold uppercase text-zinc-400">
                {tServices('SelectAService')}
              </div>
            ) : (
              <div className="flex h-full flex-col gap-8">
                {/* Form */}
                <form
                  onSubmit={handleCreateRule}
                  className="flex flex-col gap-4 border-4 border-zinc-900 p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]"
                >
                  <h3 className="text-xl font-black uppercase">
                    {tServices('SetNewPrice')}
                  </h3>
                  {errorMsg && (
                    <div className="bg-red-50 p-2 text-xs font-bold text-red-600 border-l-4 border-red-600">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs font-bold uppercase">
                        {tServices('UnitPrice')}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder={tServices('PlaceholderPrice')}
                        className="rounded-none border-2 border-zinc-900"
                        required
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs font-bold uppercase">
                        {tServices('EffectiveFrom')}
                      </Label>
                      <Input
                        type="date"
                        value={effectiveStart}
                        onChange={(e) => setEffectiveStart(e.target.value)}
                        className="rounded-none border-2 border-zinc-900"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="self-end rounded-none border-4 border-zinc-900 bg-zinc-900 px-8 py-6 font-black uppercase text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]"
                  >
                    {isSaving ? '...' : tServices('AddPriceRule')}
                  </Button>
                </form>

                {/* History */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400">
                    {tServices('PriceHistory')}
                  </h3>
                  {currentRules.length === 0 ? (
                    <p className="text-sm font-bold uppercase text-zinc-500">
                      {tServices('NoRulesConfigured')}
                    </p>
                  ) : (
                    <table className="w-full text-left text-sm font-bold uppercase border-4 border-zinc-900">
                      <thead className="bg-zinc-900 text-white">
                        <tr>
                          <th className="p-3 border-r-4 border-white min-w-[120px]">
                            {tServices('Price')}
                          </th>
                          <th className="p-3 border-r-4 border-white">
                            {tServices('StartDate')}
                          </th>
                          <th className="p-3">{tServices('EndDate')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-4 divide-zinc-900 text-zinc-900 bg-white">
                        {currentRules.map((rule, idx) => (
                          <tr
                            key={rule.id}
                            className={
                              idx === 0 && !rule.effective_end
                                ? 'bg-green-50'
                                : ''
                            }
                          >
                            <td className="p-3 border-r-4 border-zinc-900">
                              {rule.unit_price} / {unit}
                            </td>
                            <td className="p-3 border-r-4 border-zinc-900">
                              {format.dateTime(new Date(rule.effective_start), {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="p-3 text-zinc-500">
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
