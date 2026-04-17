import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Zap } from '@/assets/icons';

interface MeterInfoCardProps {
  selectedMeter: any;
  selectedService: any;
  isAlreadySubmitted: boolean;
}

export function MeterInfoCard({
  selectedMeter,
  selectedService,
  isAlreadySubmitted,
}: MeterInfoCardProps) {
  const { t } = useTranslation();

  const unitKey = `Services.Unit_${selectedService?.unit || ''}`;
  const unitFallback = selectedService?.unit || '';

  return (
    <View className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex-row">
      <View className="h-8 w-8 bg-primary/20 rounded-full items-center justify-center mr-4">
        <Zap size={16} className="text-primary" />
      </View>
      <View className="flex-1">
        <Text className="text-primary font-bold text-sm">
          {t('Services.submission.meterInfo', {
            serviceName: selectedService?.name?.toLowerCase() || '',
          })}
        </Text>

        <View className="mt-2 space-y-1">
          <View className="flex-row items-center">
            <Text className="text-muted text-xs w-24">
              {t('Services.submission.status')}
            </Text>
            <View className="flex-row items-center">
              <View
                className={`h-2 w-2 rounded-full mr-1.5 ${isAlreadySubmitted ? 'bg-success' : 'bg-warning'}`}
              />
              <Text className="text-text font-medium text-xs">
                {isAlreadySubmitted
                  ? t('Services.submission.submitted')
                  : t('Services.submission.notSubmitted')}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-1">
            <Text className="text-muted text-xs w-24">
              {t('Services.submission.lastRecorded')}
            </Text>
            <Text className="text-text font-bold text-xs">
              {selectedMeter
                ? selectedMeter.latest_reading || selectedMeter.initial_reading
                : '0'}{' '}
              {t(unitKey, unitFallback)}
            </Text>
          </View>

          {selectedMeter?.serial_number && (
            <View className="flex-row items-center mt-1">
              <Text className="text-muted text-xs w-24">
                {t('Services.submission.serialNumber')}
              </Text>
              <Text className="text-text font-medium text-xs uppercase">
                {selectedMeter.serial_number}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
