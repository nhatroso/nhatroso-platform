import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Zap } from '@/assets/icons';

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
                className={`h-2 w-2 rounded-full mr-1.5 ${statusInfo.color}`}
              />
              <Text className={`font-medium text-xs ${statusInfo.textClass}`}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-1">
            <Text className="text-muted text-xs w-24">
              {t('Services.submission.lastRecorded')}
            </Text>
            <Text className="text-text font-bold text-xs">
              {previousReading}{' '}
              {String(
                t(
                  `Services.Unit_${selectedService?.unit || ''}`,
                  selectedService?.unit || '',
                ),
              )}
            </Text>
          </View>

          {meter?.serial_number && (
            <View className="flex-row items-center mt-1">
              <Text className="text-muted text-xs w-24">
                {t('Services.submission.serialNumber')}
              </Text>
              <Text className="text-text font-medium text-xs uppercase">
                {meter.serial_number}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
