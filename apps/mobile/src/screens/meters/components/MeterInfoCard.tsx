import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Zap, Droplets } from '@/assets/icons';

interface MeterInfoCardProps {
  meter: any;
  selectedService: any;
  previousReading: number;
}

export function MeterInfoCard({
  meter,
  selectedService,
  previousReading,
}: MeterInfoCardProps) {
  const { t } = useTranslation();
  const isElectricity = selectedService?.name
    ?.toLowerCase()
    .includes('electricity');
  const Icon = isElectricity ? Zap : Droplets;

  const getStatusInfo = () => {
    const status = meter?.latest_reading_status || 'PENDING';

    switch (status) {
      case 'COMPLETED':
      case 'SUBMITTED':
        return {
          color: 'bg-success',
          label: t('Services.submission.status_completed', 'Đã ghi nhận'),
          textClass: 'text-success',
        };
      case 'PROCESSING':
        return {
          color: 'bg-primary',
          label: t(
            'Services.submission.status_processing',
            'Đang xử lý OCR...',
          ),
          textClass: 'text-primary',
        };
      case 'MANUAL_REVIEW':
        return {
          color: 'bg-warning',
          label: t('Services.submission.status_review', 'Chờ duyệt'),
          textClass: 'text-warning',
        };
      case 'FAILED':
        let errorLabel = t('Services.submission.status_failed', 'Lỗi xử lý');
        const error = meter?.latest_reading_error;
        if (error?.includes('MismatchedType')) {
          errorLabel = t(
            'Services.submission.error_mismatch',
            'Ảnh không hợp lệ',
          );
        } else if (error?.includes('InvalidImage')) {
          errorLabel = t(
            'Services.submission.error_invalid_image',
            'Ảnh không hợp lệ',
          );
        }
        return {
          color: 'bg-error',
          label: errorLabel,
          textClass: 'text-error',
        };
      default:
        return {
          color: 'bg-warning',
          label: t('Services.submission.status_pending', 'Chưa nộp'),
          textClass: 'text-muted',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View className="bg-white p-4 rounded-xl border border-border shadow-sm flex-row items-center mb-5">
      <View
        className={`h-10 w-10 ${isElectricity ? 'bg-warning/10' : 'bg-primary/10'} rounded-xl items-center justify-center mr-3`}
      >
        <Icon
          size={20}
          className={isElectricity ? 'text-warning' : 'text-primary'}
        />
      </View>
      <View className="flex-1">
        <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1">
          {t('Services.submission.meterInfo')}
        </Text>
        <Text className="text-text font-bold text-base capitalize">
          {selectedService?.name || ''}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg">
            <View
              className={`h-1.5 w-1.5 rounded-full mr-2 ${statusInfo.color}`}
            />
            <Text className={`font-bold text-[11px] ${statusInfo.textClass}`}>
              {statusInfo.label}
            </Text>
          </View>

          <View className="flex-row items-baseline">
            <Text className="text-muted text-[10px] mr-1">
              {t('Services.submission.lastRecorded', 'Số cuối:')}
            </Text>
            <Text className="text-text font-black text-sm">
              {previousReading}
            </Text>
            <Text className="text-muted text-[10px] ml-0.5 font-bold italic">
              {String(
                t(
                  `Services.Unit_${selectedService?.unit || ''}`,
                  selectedService?.unit || '',
                ),
              )}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
