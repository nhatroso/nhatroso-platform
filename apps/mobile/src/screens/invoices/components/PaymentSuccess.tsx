import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CheckCircle2 } from '@/assets/icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/format';
import { InvoiceResponse } from '@nhatroso/shared';

interface PaymentSuccessProps {
  invoice: InvoiceResponse;
}

export function PaymentSuccess({ invoice }: PaymentSuccessProps) {
  const { t } = useTranslation();
  const amount = Number(invoice.total_amount);

  return (
    <View className="flex-1 bg-background px-8 items-center justify-center">
      <View className="items-center mb-8">
        <View className="h-28 w-28 bg-success/10 rounded-full items-center justify-center mb-6">
          <View className="h-20 w-20 bg-success/20 rounded-full items-center justify-center">
            <CheckCircle2 size={56} className="text-success" />
          </View>
        </View>
        <Text className="text-3xl font-black text-text text-center tracking-tight mb-2">
          {t('Invoices.payment.successTitle')}
        </Text>
        <Text className="text-muted text-center text-sm px-4">
          {t('Invoices.payment.successDesc', { id: invoice.id })}
        </Text>
      </View>

      <View className="w-full bg-white p-6 rounded-[32px] border border-border/50 shadow-sm mb-8">
        <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-6 text-center">
          {t('Invoices.payment.transactionDetails')}
        </Text>

        <View className="gap-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted text-xs">
              {t('Invoices.amount_label')}
            </Text>
            <Text className="text-text font-black text-base">
              {formatCurrency(amount)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-muted text-xs">
              {t('Invoices.payment.paymentMethod')}
            </Text>
            <Text className="text-text font-bold text-xs uppercase tracking-wider">
              {t('Invoices.payment.vietqr')}
            </Text>
          </View>
          <View className="flex-row justify-between items-center pt-4 border-t border-border/20">
            <Text className="text-muted text-xs">
              {t('Invoices.payment.paymentTime')}
            </Text>
            <Text className="text-text font-bold text-xs">
              {t('Invoices.payment.justNow')}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center bg-muted/5 px-6 py-3 rounded-full">
        <ActivityIndicator size="small" color="#6b7280" className="mr-3" />
        <Text className="text-muted text-[11px] font-bold uppercase tracking-wider">
          {t('Invoices.payment.redirecting')}
        </Text>
      </View>
    </View>
  );
}
