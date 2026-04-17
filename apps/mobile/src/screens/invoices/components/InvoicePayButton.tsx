import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from '@/assets/icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InvoicePayButtonProps {
  invoiceId: string | number;
}

export function InvoicePayButton({ invoiceId }: InvoicePayButtonProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 border-t border-border"
      style={{ paddingBottom: Math.max(insets.bottom, 24) }}
    >
      <TouchableOpacity
        className="bg-[#1c64f2] h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/30"
        activeOpacity={0.9}
        onPress={() => router.push(`/invoices/payment?id=${invoiceId}`)}
      >
        <Text className="text-white font-black text-lg mr-2 uppercase tracking-tight">
          {t('Invoices.payNow')}
        </Text>
        <ArrowRight size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
