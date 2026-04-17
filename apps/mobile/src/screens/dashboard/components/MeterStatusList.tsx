import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Zap, Droplets, CheckCircle2 } from '@/assets/icons';

interface MeterStatusListProps {
  meters: any[] | undefined;
  isLoadingMeters: boolean;
  getServiceLabel: (name?: string | null) => string;
  activeRequest?: any;
}

export function MeterStatusList({
  meters,
  isLoadingMeters,
  getServiceLabel,
  activeRequest,
}: MeterStatusListProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (isLoadingMeters) {
    return null; // Parent handles spinner
  }

  if (!Array.isArray(meters) || meters.length === 0) {
    return null;
  }

  return (
    <View className="gap-y-3">
      {meters.map((m) => {
        const isElectricity = m.service_name
          ?.toLowerCase()
          .includes('electricity');

        const isSubmittedThisMonth = activeRequest?.period_month
          ? m.latest_reading_period === activeRequest.period_month &&
            m.latest_reading != null
          : m.latest_reading != null;

        const serviceLabel =
          getServiceLabel(m.service_name) ||
          (isElectricity
            ? t('Dashboard.tenant.electricity')
            : t('Dashboard.tenant.water'));

        return (
          <TouchableOpacity
            key={m.id}
            onPress={() =>
              router.push({
                pathname: '/meters/history',
                params: {
                  meterId: m.id,
                  serviceName: String(serviceLabel),
                  unit: String(
                    t(
                      `Services.Unit_${m.service_unit || (isElectricity ? 'kWh' : 'm³')}`,
                      m.service_unit || (isElectricity ? 'kWh' : 'm³'),
                    ),
                  ),
                },
              })
            }
            className="bg-white p-4 rounded-2xl border border-border shadow-sm mb-3 active:bg-input"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View
                  className={`h-8 w-8 rounded-full items-center justify-center mr-3 ${isElectricity ? 'bg-warning/10' : 'bg-primary/10'}`}
                >
                  {isElectricity ? (
                    <Zap size={16} className="text-warning" />
                  ) : (
                    <Droplets size={16} className="text-primary" />
                  )}
                </View>
                <Text className="text-text font-bold text-sm">
                  {String(serviceLabel)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View
                  className={`h-2 w-2 rounded-full mr-1.5 ${isSubmittedThisMonth ? 'bg-success' : 'bg-warning'}`}
                />
                <Text className="text-xs text-muted font-medium mr-1.5">
                  {isSubmittedThisMonth
                    ? String(t('Dashboard.tenant.submitted'))
                    : String(t('Dashboard.tenant.notSubmitted'))}
                </Text>
                <CheckCircle2 size={16} className="text-muted/50" />
              </View>
            </View>

            <View className="bg-background rounded-xl p-3 flex-row items-center justify-between">
              <View>
                <Text className="text-muted text-[10px] uppercase font-bold mb-0.5">
                  {t('Dashboard.tenant.latestReading')}
                </Text>
                <View className="flex-row items-end">
                  <Text className="text-text font-bold text-lg leading-none">
                    {m.latest_reading != null
                      ? m.latest_reading
                      : m.initial_reading}
                  </Text>
                  <Text className="text-muted text-xs font-medium ml-1 mb-0.5">
                    {String(
                      t(
                        `Services.Unit_${m.service_unit || (isElectricity ? 'kWh' : 'm³')}`,
                        m.service_unit || (isElectricity ? 'kWh' : 'm³'),
                      ),
                    )}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-muted text-[10px] uppercase font-bold mb-0.5">
                  {t('Dashboard.tenant.recordedAt')}
                </Text>
                <Text className="text-text font-medium text-xs">
                  {m.latest_reading != null
                    ? new Date(m.latest_reading_date || '').toLocaleDateString()
                    : String(t('Dashboard.tenant.pendingUpdate'))}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
