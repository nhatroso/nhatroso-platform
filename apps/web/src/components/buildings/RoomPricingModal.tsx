import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room } from '@nhatroso/shared';
import { useRoomPricing } from '@/hooks/room/useRoomPricing';
import { getServiceDisplayName, getUnitDisplayName } from '@/lib/utils';
import { Gauge } from 'lucide-react';

interface RoomPricingModalProps {
  room: Room;
  onClose: () => void;
}

export function RoomPricingModal({ room, onClose }: RoomPricingModalProps) {
  const t = useTranslations('Buildings');
  const tServices = useTranslations('Services');

  const {
    services,
    roomServices,
    serviceTemplates,
    activeService,
    activeMeter,
    loading,
    isSaving,
    selectedServiceId,
    stagedIsActive,
    stagedPriceRuleId,
    initialMeterReading,
    errorMsg,
    isActuallyEnabled,
    isNewUtilityActivation,
    setSelectedServiceId,
    setStagedIsActive,
    setStagedPriceRuleId,
    setInitialMeterReading,
    setErrorMsg,
    handleSave,
  } = useRoomPricing(room);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-strong/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[750px] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-gray-border bg-gray-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <div>
            <h2 className="text-h2 font-bold text-gray-text">
              {t('Pricing')} — {room.code}
            </h2>
            <p className="text-body text-gray-muted">
              {tServices('ManagePricingForThisRoom')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center rounded-lg bg-transparent p-1.5 text-body text-gray-muted hover:bg-gray-surface hover:text-gray-text"
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

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Services Navigation */}
          <div className="w-1/3 min-w-[200px] overflow-y-auto border-r border-gray-border bg-gray-surface/30 px-4 py-8">
            <h3 className="mb-6 px-2 text-[11px] font-bold uppercase tracking-widest text-gray-muted">
              {tServices('Services')}
            </h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-xl bg-gray-subtle"
                  />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="p-6 text-center text-body italic text-gray-muted">
                {tServices('NoActiveServices')}
              </div>
            ) : (
              <ul className="space-y-2">
                {services.map((s) => {
                  const isActive = s.id === selectedServiceId;
                  const hasAssigned = roomServices.some(
                    (rs) => rs.service_id === s.id,
                  );

                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`group relative flex w-full items-center gap-4 rounded-xl border border-gray-border bg-gray-card p-4 text-gray-text shadow-sm transition-all hover:border-primary/50 hover:shadow-md ${isActive ? 'border-primary bg-white ring-1 ring-primary shadow-lg shadow-primary/5 scale-[1.02] z-10' : 'opacity-80 hover:opacity-100 bg-gray-surface/50'}`}
                      >
                        <div className="flex flex-1 flex-col text-left overflow-hidden">
                          <span
                            className={`truncate text-sm font-bold text-gray-text transition-colors ${isActive ? 'text-primary dark:text-primary-dark' : ''}`}
                          >
                            {getServiceDisplayName(s.name, tServices)}
                          </span>
                          <span className="text-tiny text-gray-muted mt-0.5">
                            {getUnitDisplayName(s.unit, tServices)}
                          </span>
                        </div>
                        {hasAssigned && (
                          <div
                            className={`h-2.5 w-2.5 rounded-full bg-primary transition-all ${isActive ? 'bg-primary ring-4 ring-primary/10' : ''}`}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Right: Content Area */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-gray-card p-8">
            {!selectedServiceId ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-gray-muted">
                  {tServices('SelectAServiceToManagePricing')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Toggle Area */}
                <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-6 border-b border-gray-surface">
                    <div>
                      <h3 className="text-body font-bold text-gray-text">
                        {tServices('EnableServiceForRoom')}
                      </h3>
                      <p className="text-body text-gray-muted mt-1">
                        {tServices('DisableServiceDescription', {
                          name: getServiceDisplayName(
                            activeService?.name || '',
                            tServices,
                          ),
                        })}
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={stagedIsActive}
                        onChange={(e) => setStagedIsActive(e.target.checked)}
                        disabled={isSaving}
                        className="peer sr-only"
                      />
                      <div className="peer relative h-6 w-11 rounded-full bg-gray-subtle after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                    </label>
                  </div>

                  {(() => {
                    const meter = activeMeter;
                    if (!meter) return null;
                    const reading =
                      meter.latest_reading ?? meter.initial_reading;
                    return (
                      <div className="mt-8 flex items-center gap-5 rounded-2xl bg-primary-light p-6 border border-primary-light/50 shadow-inner">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-primary/10">
                          <Gauge
                            size={28}
                            className="text-primary dark:text-primary-dark"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-body font-bold text-primary dark:text-primary-dark opacity-80">
                            {tServices('CurrentMeterReading')}
                          </p>
                          <p className="text-2xl font-black text-gray-text mt-1.5 tracking-tight">
                            {Number(reading).toLocaleString()}{' '}
                            <span className="text-lg font-normal text-gray-muted ml-1 italic capitalize">
                              {meter.service_unit ||
                                getUnitDisplayName(
                                  activeService?.unit || '',
                                  tServices,
                                )}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {!stagedIsActive && (
                    <div
                      className="mt-4 p-4 text-body text-gray-text rounded-lg bg-gray-surface"
                      role="alert"
                    >
                      <span className="font-medium">
                        {tServices('NotAppliedYet')}
                      </span>{' '}
                      {tServices('NotAppliedDescription')}
                    </div>
                  )}

                  {errorMsg && (
                    <div
                      className="mt-4 rounded-lg bg-warning-light p-4 text-warning"
                      role="alert"
                    >
                      {errorMsg}
                    </div>
                  )}
                </div>

                {/* Meter Initial Reading — only for new utility service activations */}
                {isNewUtilityActivation && (
                  <div className="rounded-lg border border-warning-light bg-warning-light/50 px-6 py-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Gauge size={18} className="text-warning" />
                      <h3 className="text-body font-bold text-warning">
                        {tServices('SetupMeter')}
                      </h3>
                    </div>
                    <p className="text-tiny text-gray-muted mb-4">
                      {tServices('SetupMeterDescription')}
                    </p>
                    <div className="max-w-xs">
                      <label className="block text-body font-medium text-gray-text mb-1.5">
                        {tServices('InitialReadingLabel')}
                        <span className="text-danger ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={initialMeterReading}
                        onChange={(e) => {
                          setInitialMeterReading(e.target.value);
                          setErrorMsg('');
                        }}
                        placeholder={tServices('InitialReadingPlaceholder')}
                        className="block w-full rounded-lg border border-gray-border bg-gray-input px-3 py-2.5 text-body text-gray-text shadow-sm focus:border-warning focus:ring-2 focus:ring-warning-light"
                      />
                      <p className="mt-1.5 text-tiny text-gray-muted/50">
                        {tServices('InitialReadingHint')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Price Template Options */}
                {stagedIsActive && (
                  <div className="rounded-lg border border-gray-border bg-gray-card px-6 py-5 shadow-sm">
                    <h3 className="text-body font-semibold text-gray-text mb-4">
                      {tServices('SetRoomPricing')}
                    </h3>

                    {serviceTemplates.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-border p-8 text-center">
                        <p className="text-body italic text-gray-muted">
                          {tServices('NoTemplatesForThisService')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="max-w-md">
                          <label className="block mb-2 text-body font-medium text-gray-text">
                            {tServices('PriceRuleLabel')}
                          </label>
                          <select
                            value={stagedPriceRuleId}
                            onChange={(e) =>
                              setStagedPriceRuleId(e.target.value)
                            }
                            className="bg-gray-input border border-gray-border text-gray-text text-body rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                          >
                            {serviceTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.unit_price}/
                                {getUnitDisplayName(
                                  activeService?.unit || '',
                                  tServices,
                                )}
                                )
                              </option>
                            ))}
                          </select>
                        </div>

                        {stagedPriceRuleId && (
                          <div className="p-4 rounded-lg bg-gray-surface border border-gray-border">
                            {serviceTemplates
                              .filter((t) => t.id === stagedPriceRuleId)
                              .map((t) => (
                                <div key={t.id}>
                                  <p className="text-body font-medium text-primary">
                                    {tServices('CurrentlySelecting', {
                                      name: t.name,
                                    })}
                                  </p>
                                  <p className="text-h1 font-bold tracking-tight text-gray-text mt-1">
                                    {Number(t.unit_price).toLocaleString()}
                                    {tServices('Currency')}{' '}
                                    <span className="text-body font-normal text-gray-muted">
                                      /{' '}
                                      {getUnitDisplayName(
                                        activeService?.unit || '',
                                        tServices,
                                      )}
                                    </span>
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-lg bg-primary px-8 py-3 text-center text-body font-bold text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-95"
                          >
                            {isSaving
                              ? tServices('Saving')
                              : tServices('SaveConfig')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show Save button even if toggling OFF, to apply the removal */}
                {!stagedIsActive && isActuallyEnabled && (
                  <div className="flex justify-end pt-4 border-t border-gray-border">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-6 py-2.5 text-body font-bold text-center text-white bg-danger rounded-lg hover:bg-danger-hover focus:ring-4 focus:outline-none focus:ring-danger-light shadow-md shadow-danger/20 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving
                        ? tServices('Saving')
                        : tServices('DisableServiceForRoom')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
