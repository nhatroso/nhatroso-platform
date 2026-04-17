import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInvoiceDetail } from './hooks/useInvoiceDetail';
import { InvoiceHero } from './components/InvoiceHero';
import { InvoiceDetailsCard } from './components/InvoiceDetailsCard';
import { InvoiceFooterCard } from './components/InvoiceFooterCard';
import { InvoicePayButton } from './components/InvoicePayButton';

export function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const { data: invoice, isLoading } = useInvoiceDetail(Number(id));

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1c64f2" />
      </View>
    );
  }

  if (!invoice) return null;

  const isUnpaid = invoice.status === 'UNPAID';

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <InvoiceHero invoice={invoice} />

        <View className="px-6 -mt-6 gap-y-6">
          <InvoiceDetailsCard invoice={invoice} />
          <InvoiceFooterCard invoice={invoice} />
        </View>
      </ScrollView>

      {isUnpaid && <InvoicePayButton invoiceId={id as string} />}
    </View>
  );
}
