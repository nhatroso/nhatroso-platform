import React from 'react';
import { View, Text, Image } from 'react-native';
import { Loader2, Info } from '@/assets/icons';
import { useTranslation } from 'react-i18next';

interface VietQRCardProps {
  qrUrl: string;
  paymentData: any;
  isExpired: boolean;
  socketStatus: string;
  timeLeft: number;
  amount: number;
}

export function VietQRCard({
  qrUrl,
  paymentData,
  isExpired,
  socketStatus,
  timeLeft,
  amount,
}: VietQRCardProps) {
  const { t } = useTranslation();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-white p-8 rounded-[40px] border border-border/50 shadow-xl items-center mb-8">
      {/* QR Code Section */}
      <View className="bg-white p-2 rounded-2xl border border-border/20 mb-6">
        {!isExpired && paymentData ? (
          <Image
            source={{ uri: qrUrl }}
            style={{ width: 240, height: 240 }}
            resizeMode="contain"
          />
        ) : !isExpired && !paymentData ? (
          <View
            style={{ width: 240, height: 240 }}
            className="bg-muted/5 items-center justify-center rounded-xl"
          >
            <Loader2 size={40} className="text-primary animate-spin mb-2" />
            <Text className="text-muted/50 font-bold text-center px-4 text-xs">
              {t('Invoices.payment.initializingQR')}
            </Text>
          </View>
        ) : (
          <View
            style={{ width: 240, height: 240 }}
            className="bg-muted/5 items-center justify-center rounded-xl"
          >
            <Info size={40} className="text-warning/50 mb-2" />
            <Text className="text-muted/50 font-bold text-center px-4">
              {t('Invoices.payment.qrExpired')}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-col items-center mb-4">
        <View className="flex-row items-center bg-primary/5 px-4 py-2 rounded-full mb-2">
          {socketStatus === 'CONNECTED' ? (
            <>
              <Loader2 size={14} className="text-primary animate-spin mr-2" />
              <Text className="text-primary text-[11px] font-bold uppercase tracking-wider">
                {t('Invoices.payment.waitingPayment')}
              </Text>
            </>
          ) : (
            <>
              <View className="h-2 w-2 rounded-full bg-warning mr-2" />
              <Text className="text-warning text-[11px] font-bold uppercase tracking-wider">
                {t('Invoices.payment.reconnecting')}
              </Text>
            </>
          )}
        </View>

        {!isExpired && (
          <Text
            className={`text-[10px] font-bold ${timeLeft < 60 ? 'text-error' : 'text-muted'}`}
          >
            {t('Invoices.payment.expiresIn', { time: formatTime(timeLeft) })}
          </Text>
        )}

        {isExpired && (
          <Text className="text-error text-[10px] font-bold uppercase tracking-wider">
            {t('Invoices.payment.qrExpired')}
          </Text>
        )}
      </View>

      <Text className="text-muted text-center text-sm leading-relaxed px-4">
        {t('Invoices.payment.scanToPay')}
      </Text>
    </View>
  );
}
