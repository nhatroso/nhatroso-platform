import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/format';
import { useServiceLabel } from '@/hooks/useServiceLabel';
import { InvoiceResponse } from '@nhatroso/shared';

interface InvoiceDetailsCardProps {
  invoice: InvoiceResponse;
}

export function InvoiceDetailsCard({ invoice }: InvoiceDetailsCardProps) {
  const { t } = useTranslation();
  const getServiceLabel = useServiceLabel();

  return (
    <View className="bg-white p-6 rounded-[32px] border border-border/50 shadow-sm">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-xl font-black text-text tracking-tight">
          {t('Invoices.details')}
        </Text>
        <View className="bg-primary/5 px-2.5 py-1 rounded-lg">
          <Text className="text-primary text-[10px] font-bold">
            #{invoice.id}
          </Text>
        </View>
      </View>

      <View className="gap-y-6">
        {invoice.details.map((item, idx) => (
          <View key={idx} className="flex-row justify-between items-start">
            <View className="flex-1 mr-4">
              <Text className="text-text font-bold text-base leading-tight">
                {getServiceLabel(item.description)}
              </Text>
            </View>
            <Text className="text-text font-black text-base">
              {formatCurrency(Number(item.amount))}
            </Text>
          </View>
        ))}

        <View className="border-t border-border/50 pt-6 mt-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted font-black uppercase tracking-widest text-[11px]">
              {t('Invoices.totalAmount')}
            </Text>
            <Text className="text-[#1c64f2] font-black text-2xl tracking-tight">
              {formatCurrency(Number(invoice.total_amount))}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
