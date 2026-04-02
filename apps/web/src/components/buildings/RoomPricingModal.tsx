import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room } from '@nhatroso/shared';
import { useRoomPricing } from '@/hooks/use-room-pricing';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[750px] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('Pricing')} — {room.code}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tServices('ManagePricingForThisRoom')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
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
          <div className="w-1/4 min-w-[200px] overflow-y-auto border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {loading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                  />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="p-6 text-center text-sm italic text-gray-500 dark:text-gray-400">
                {tServices('NoActiveServices')}
              </div>
            ) : (
              <ul className="space-y-2 p-3 font-medium">
                {services.map((s) => {
                  const isActive = s.id === selectedServiceId;
                  const hasAssigned = roomServices.some(
                    (rs) => rs.service_id === s.id,
                  );

                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`group flex w-full items-center rounded-lg p-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 ${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      >
                        <div className="flex flex-1 flex-col text-left">
                          <span
                            className={`text-sm ${isActive ? 'font-bold' : ''}`}
                          >
                            {getServiceDisplayName(s.name, tServices)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getUnitDisplayName(s.unit, tServices)}
                          </span>
                        </div>
                        {hasAssigned && (
                          <span className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-blue-600 ms-3" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Right: Content Area */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6 dark:bg-gray-900">
            {!selectedServiceId ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {tServices('SelectAServiceToManagePricing')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Toggle Area */}
                <div className="rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {tServices('EnableServiceForRoom')}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
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
                      <div className="peer relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800 rtl:peer-checked:after:-translate-x-full" />
                    </label>
                  </div>

                  {(() => {
                    const meter = activeMeter;
                    if (!meter) return null;
                    const reading =
                      meter.latest_reading ?? meter.initial_reading;
                    return (
                      <div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                        <Gauge
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                            {tServices('CurrentMeterReading')}
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                            {Number(reading).toLocaleString()}{' '}
                            {meter.service_unit ||
                              getUnitDisplayName(
                                activeService?.unit || '',
                                tServices,
                              )}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {!stagedIsActive && (
                    <div
                      className="mt-4 p-4 text-sm text-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
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
                      className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
                      role="alert"
                    >
                      {errorMsg}
                    </div>
                  )}
                </div>

                {/* Meter Initial Reading — only for new utility service activations */}
                {isNewUtilityActivation && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-6 py-5 shadow-sm dark:border-amber-800/30 dark:bg-amber-950/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Gauge size={18} className="text-amber-600" />
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                        {tServices('SetupMeter')}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      {tServices('SetupMeterDescription')}
                    </p>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
                        {tServices('InitialReadingLabel')}
                        <span className="text-red-500 ml-1">*</span>
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
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-amber-500"
                      />
                      <p className="mt-1.5 text-xs text-gray-400">
                        {tServices('InitialReadingHint')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Price Template Options */}
                {stagedIsActive && (
                  <div className="rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                      {tServices('SetRoomPricing')}
                    </h3>

                    {serviceTemplates.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                        <p className="text-sm italic text-gray-500 dark:text-gray-400">
                          {tServices('NoTemplatesForThisService')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="max-w-md">
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            {tServices('PriceRuleLabel')}
                          </label>
                          <select
                            value={stagedPriceRuleId}
                            onChange={(e) =>
                              setStagedPriceRuleId(e.target.value)
                            }
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            {serviceTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.unit_price} /{' '}
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
                          <div className="p-4 rounded-lg bg-blue-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700">
                            {serviceTemplates
                              .filter((t) => t.id === stagedPriceRuleId)
                              .map((t) => (
                                <div key={t.id}>
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                    {tServices('CurrentlySelecting', {
                                      name: t.name,
                                    })}
                                  </p>
                                  <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
                                    {Number(t.unit_price).toLocaleString()}
                                    {tServices('Currency')}{' '}
                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
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
                            className="rounded-lg bg-blue-700 px-8 py-3 text-center text-sm font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/20 active:scale-95"
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
                  <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 shadow-md shadow-red-500/20 active:scale-95 disabled:opacity-50"
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
