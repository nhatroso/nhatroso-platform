import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { CreditCard, ChevronRight } from '@/assets/icons';
import { formatDate, formatCurrency } from '@/utils/format';
import { StatusBadge } from '@/components/core/StatusBadge';
import { InvoiceResponse } from '@nhatroso/shared';

interface InvoiceItemCardProps {
  item: InvoiceResponse;
}

export function InvoiceItemCard({ item }: InvoiceItemCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const renderStatus = (status: string | null) => {
    const isPaid = status === 'PAID';
    return (
      <StatusBadge
        status={isPaid ? 'success' : 'error'}
        label={isPaid ? t('Invoices.status.paid') : t('Invoices.status.unpaid')}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/invoices/${item.id}`)}
      className="bg-white p-5 rounded-2xl border border-border shadow-sm active:bg-input"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View
            className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${item.status === 'PAID' ? 'bg-success/10' : 'bg-error/10'}`}
          >
            <CreditCard
              size={20}
              className={item.status === 'PAID' ? 'text-success' : 'text-error'}
            />
          </View>
          <View>
            <Text className="text-muted text-[10px] font-bold uppercase tracking-widest leading-tight">
              {t('Invoices.dueDate')}
            </Text>
            <Text className="text-text font-extrabold text-sm">
              {formatDate(item.due_date || item.created_at)}
            </Text>
          </View>
        </View>
        {renderStatus(item.status)}
      </View>

      <View className="flex-row items-end justify-between border-t border-border/50 pt-4">
        <View className="flex-1">
          <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1">
            {t('Invoices.totalAmount')}
          </Text>
          <Text className="text-text font-black text-2xl tracking-tight">
            {formatCurrency(Number(item.total_amount))}
          </Text>
          <Text
            className="text-muted text-[11px] font-medium mt-1.5"
            numberOfLines={1}
          >
            {item.details.map((d) => d.description).join(' • ')}
          </Text>
        </View>
        <View className="h-8 w-8 bg-muted/5 rounded-full items-center justify-center">
          <ChevronRight size={16} className="text-muted" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
