import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CreditCard, Clock } from '@/assets/icons';
import { formatDate, formatCurrency } from '@/utils/format';
import { InvoiceResponse } from '@nhatroso/shared';

interface InvoiceHeroProps {
  invoice: InvoiceResponse;
}

export function InvoiceHero({ invoice }: InvoiceHeroProps) {
  const { t } = useTranslation();

  return (
    <View className="bg-[#1c64f2] pt-12 pb-10 px-6 rounded-b-[40px] shadow-sm">
      <View className="items-center mb-6">
        <View className="h-16 w-16 bg-white/20 rounded-2xl items-center justify-center mb-5">
          <CreditCard size={32} color="#ffffff" />
        </View>
        <Text className="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-2">
          {t('Invoices.totalAmount')}
        </Text>
        <Text className="text-white font-black text-4xl tracking-tighter">
          {formatCurrency(Number(invoice.total_amount))}
        </Text>
      </View>

      <View className="flex-row items-center justify-center gap-x-3">
        <View className="flex-row items-center bg-white/15 px-4 py-2 rounded-2xl">
          <View
            className={`h-2 w-2 rounded-full mr-2 ${invoice.status === 'PAID' ? 'bg-success' : 'bg-error'}`}
          />
          <Text className="text-white text-[11px] font-black uppercase tracking-wider">
            {invoice.status === 'PAID'
              ? t('Invoices.status.paid')
              : t('Invoices.status.unpaid')}
          </Text>
        </View>
        <View className="flex-row items-center bg-white/15 px-4 py-2 rounded-2xl">
          <Clock size={14} color="#ffffff" className="mr-2" />
          <Text className="text-white text-[11px] font-black uppercase tracking-wider">
            {formatDate(invoice.due_date || invoice.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );
}
