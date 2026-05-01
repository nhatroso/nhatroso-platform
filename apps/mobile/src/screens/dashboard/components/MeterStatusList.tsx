import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Zap, Droplets } from '@/assets/icons';
import { AppCard } from '@/components/core/AppCard';
import { StatusBadge } from '@/components/core/StatusBadge';

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
            m.latest_reading_status != null &&
            ['SUBMITTED', 'COMPLETED', 'MANUAL_REVIEW'].includes(
              m.latest_reading_status,
            )
          : m.latest_reading_status != null &&
            ['SUBMITTED', 'COMPLETED', 'MANUAL_REVIEW'].includes(
              m.latest_reading_status,
            );

        const serviceLabel =
          getServiceLabel(m.service_name) ||
          (isElectricity
            ? t('Dashboard.tenant.electricity')
            : t('Dashboard.tenant.water'));

        return (
          <AppCard
            key={m.id}
            onPress={() =>
              router.push({
                pathname: '/meters',
                params: { type: isElectricity ? 'ELECTRIC' : 'WATER' },
              })
            }
            className="mb-3"
          >
            <View className="flex-row items-center justify-between mb-4">
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
                <StatusBadge
                  status={isSubmittedThisMonth ? 'success' : 'warning'}
                  label={
                    isSubmittedThisMonth
                      ? String(t('Dashboard.tenant.submitted'))
                      : String(t('Dashboard.tenant.notSubmitted'))
                  }
                />
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
                  {m.latest_usage != null && (
                    <Text className="text-green-600 text-xs font-bold ml-1 mb-0.5">
                      (+{m.latest_usage})
                    </Text>
                  )}
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
          </AppCard>
        );
      })}
    </View>
  );
}
