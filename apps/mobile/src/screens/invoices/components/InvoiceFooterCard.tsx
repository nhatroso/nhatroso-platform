import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, ArrowRight } from '@/assets/icons';
import { formatDate } from '@/utils/format';
import { InvoiceResponse } from '@nhatroso/shared';

interface InvoiceFooterCardProps {
  invoice: InvoiceResponse;
}

export function InvoiceFooterCard({ invoice }: InvoiceFooterCardProps) {
  const { t } = useTranslation();

  return (
    <View className="bg-white p-5 rounded-2xl border border-border/30 shadow-sm flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="h-8 w-8 bg-muted/5 rounded-lg items-center justify-center mr-3">
          <Clock size={16} className="text-muted" />
        </View>
        <View>
          <Text className="text-muted text-[10px] font-bold uppercase tracking-widest">
            {t('Invoices.createdAt')}
          </Text>
          <Text className="text-text font-bold text-xs mt-0.5">
            {formatDate(invoice.created_at)}
          </Text>
        </View>
      </View>
      <ArrowRight size={16} className="text-muted/30" />
    </View>
  );
}
