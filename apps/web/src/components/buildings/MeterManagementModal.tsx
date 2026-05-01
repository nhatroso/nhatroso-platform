import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room, MeterReading } from '@nhatroso/shared';
import { useMeterManagement } from '@/hooks/meter/useMeterManagement';
import { getServiceDisplayName } from '@/lib/utils';
import {
  Activity,
  Calendar,
  Camera,
  History,
  Zap,
  Droplets,
  ChevronRight,
  TrendingUp,
  X,
} from 'lucide-react';

interface MeterManagementModalProps {
  room: Room;
  onClose: () => void;
}

export function MeterManagementModal({
  room,
  onClose,
}: MeterManagementModalProps) {
  const t = useTranslations('Buildings');
  const tServices = useTranslations('Services');

  const {
    meters,
    selectedMeter,
    readings,
    loading,
    submitting,
    newReadingValue,
    isRecording,
    setSelectedMeter,
    setNewReadingValue,
    setIsRecording,
    handleRecordReading,
  } = useMeterManagement(room);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-card shadow-2xl border border-gray-border animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary-light p-2 text-primary">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-h3 font-bold text-gray-text">
                {t('MeterReading')} - {room.code}
              </h2>
              <p className="text-tiny text-gray-muted">
                {t('ManageUsageHistory')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-muted transition-colors hover:bg-gray-surface"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[500px]">
          {/* Sidebar - Meters */}
          <div className="w-1/3 border-r border-gray-border bg-gray-surface p-4">
            <h3 className="mb-4 text-tiny font-bold uppercase tracking-wider text-gray-muted">
              {t('AvailableMeters')}
            </h3>
            <div className="space-y-2">
              {meters.length === 0 && !loading && (
                <p className="text-center text-tiny text-gray-muted py-8 italic">
                  {t('NoMetersFound')}
                </p>
              )}
              {meters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeter(m)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    selectedMeter?.id === m.id
                      ? 'bg-primary-light text-primary shadow-sm ring-1 ring-primary/20'
                      : 'text-gray-muted hover:bg-gray-surface'
                  }`}
                >
                  {m.service_name?.toLowerCase().includes('electricity') ? (
                    <Zap size={18} />
                  ) : (
                    <Droplets size={18} />
                  )}
                  <div className="overflow-hidden">
                    <p className="truncate text-body font-semibold">
                      {getServiceDisplayName(m.service_name || '', tServices)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Readings */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedMeter ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-full bg-gray-subtle p-4 text-gray-muted/50">
                  <TrendingUp size={48} />
                </div>
                <h4 className="mt-4 text-body font-semibold text-gray-muted">
                  {t('SelectAMeterToView')}
                </h4>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <h3 className="text-body font-bold text-gray-text">
                    {t('UsageHistory')}
                  </h3>
                  {/* <button
                    onClick={() => setIsRecording(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-tiny font-semibold text-white transition-all hover:bg-primary-hover active:scale-95 shadow-sm"
                  >
                    <Plus size={14} />
                    {t('NewReading')}
                  </button> */}
                </div>

                {/* Form to record */}
                {isRecording && (
                  <div className="rounded-xl border border-primary-light bg-primary-light/10 p-4 animate-in slide-in-from-top-2">
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      <Camera size={16} />
                      <span className="text-tiny font-bold uppercase tracking-wide">
                        {t('RecordNewUsage')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newReadingValue}
                        onChange={(e) => setNewReadingValue(e.target.value)}
                        placeholder={t('EnterCurrentReading')}
                        className="block w-full rounded-lg border border-gray-border bg-gray-input p-2 text-body text-gray-text focus:border-primary focus:ring-primary"
                        autoFocus
                      />
                      <button
                        onClick={handleRecordReading}
                        disabled={submitting || !newReadingValue}
                        className="rounded-lg bg-primary px-4 text-tiny font-bold text-white hover:bg-primary-hover disabled:opacity-50"
                      >
                        {t('Save')}
                      </button>
                      <button
                        onClick={() => setIsRecording(false)}
                        className="rounded-lg border border-gray-border bg-gray-input px-3 text-tiny font-semibold text-gray-muted hover:bg-gray-surface"
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* History List */}
                <div className="space-y-3">
                  {readings.length === 0 ? (
                    <div className="py-12 text-center text-tiny text-gray-muted opacity-60">
                      <History size={24} className="mx-auto mb-2 opacity-20" />
                      {t('NoReadingsYet')}
                    </div>
                  ) : (
                    readings.map((r: MeterReading) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-xl border border-gray-border p-3 shadow-sm transition-all hover:bg-gray-surface"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-surface text-gray-muted">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <p className="text-body font-bold text-gray-text">
                              {r.reading_value}
                            </p>
                            <p className="text-tiny text-gray-muted">
                              {new Date(r.reading_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {r.usage && parseFloat(r.usage) > 0 && (
                          <div className="flex items-center gap-1.5 text-tiny font-medium text-success dark:text-success-dark">
                            <ChevronRight
                              size={12}
                              className="text-gray-muted/50"
                            />
                            +{parseFloat(r.usage).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))
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
