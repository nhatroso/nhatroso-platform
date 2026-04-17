import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Filter } from '@/assets/icons';
import { useInvoices } from './hooks/useInvoices';
import { InvoiceItemCard } from './components/InvoiceItemCard';

export function InvoicesScreen() {
  const { t } = useTranslation();
  const { data: invoices, isLoading, refreshing, onRefresh } = useInvoices();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1c64f2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        contentContainerClassName="p-6 gap-y-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1c64f2"
          />
        }
        ListHeaderComponent={
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-extrabold text-text tracking-tight">
              {t('Invoices.title')}
            </Text>
            <TouchableOpacity className="h-10 w-10 bg-input rounded-full items-center justify-center">
              <Filter size={20} className="text-muted" />
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <InvoiceItemCard item={item} />}
        ListEmptyComponent={
          <View className="mt-20 items-center justify-center">
            <Text className="text-lg font-bold text-text">
              {t('Invoices.empty')}
            </Text>
            <Text className="text-muted text-center mt-2 px-10">
              {t('Invoices.empty_desc')}
            </Text>
          </View>
        }
        ListFooterComponent={<View className="h-10" />}
      />
    </View>
  );
}
