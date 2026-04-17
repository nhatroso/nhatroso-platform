import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ChevronLeft } from '@/assets/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@/utils/format';
import { usePayment } from './hooks/usePayment';
import { PaymentSuccess } from './components/PaymentSuccess';
import { VietQRCard } from './components/VietQRCard';
import { PaymentInfoCard } from './components/PaymentInfoCard';
import { CONFIG } from '@/config';
import { useTranslation } from 'react-i18next';

export function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const {
    invoice,
    isLoading,
    isSuccess,
    paymentData,
    isExpired,
    timeLeft,
    socketStatus,
  } = usePayment(id as string);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1c64f2" />
      </View>
    );
  }

  if (!invoice) return null;

  const amount = Number(invoice.total_amount);
  const content = paymentData?.transaction_id || '';

  const { ID: BANK_ID, ACCOUNT_NO, ACCOUNT_NAME } = CONFIG.BANK;
  const qrUrl = `https://api.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-qr_only.jpg?accountName=${ACCOUNT_NAME}&amount=${amount}&addInfo=${encodeURIComponent(content)}`;

  if (isSuccess) {
    return <PaymentSuccess invoice={invoice} />;
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('Invoices.payNow'),
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <ChevronLeft size={24} className="text-text" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <Text className="text-muted font-bold uppercase tracking-widest text-[11px] mb-2">
            {t('Invoices.payment.amountToPay')}
          </Text>
          <Text className="text-text font-black text-3xl tracking-tighter">
            {formatCurrency(amount)}
          </Text>
        </View>

        <VietQRCard
          qrUrl={qrUrl}
          paymentData={paymentData}
          isExpired={isExpired}
          socketStatus={socketStatus}
          timeLeft={timeLeft}
          amount={amount}
        />

        <PaymentInfoCard
          accountNo={ACCOUNT_NO}
          accountName={ACCOUNT_NAME}
          content={content}
        />
      </ScrollView>

      <View className="p-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-transparent border border-border h-14 rounded-2xl items-center justify-center"
        >
          <Text className="text-muted font-bold">
            {t('Invoices.payment.back')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
