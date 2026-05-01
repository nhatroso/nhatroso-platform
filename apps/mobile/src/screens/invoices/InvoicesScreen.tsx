import React, { useState } from 'react';
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
import { SegmentedTabs } from '@/components/core/SegmentedTabs';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CreditCard } from 'lucide-react-native';

export function InvoicesScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('UNPAID');

  const {
    data: invoices,
    isLoading,
    refreshing,
    onRefresh,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInvoices(activeTab);

  const tabs = [
    { key: 'UNPAID', title: t('Invoices.tabs.unpaid') },
    { key: 'PAID', title: t('Invoices.tabs.paid') },
  ];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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
          <>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-extrabold text-text tracking-tight">
                  {t('Invoices.title')}
                </Text>
                <Text className="text-muted text-xs font-medium">
                  {t('Invoices.historySubtitle')}
                </Text>
              </View>
              <TouchableOpacity className="h-10 w-10 bg-input rounded-full items-center justify-center">
                <Filter size={20} className="text-muted" />
              </TouchableOpacity>
            </View>
            <SegmentedTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        }
        renderItem={({ item }) => <InvoiceItemCard item={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={CreditCard}
              title={t('Invoices.empty')}
              description={t('Invoices.empty_desc')}
            />
          ) : null
        }
        ListFooterComponent={
          <View className="py-4 items-center justify-center min-h-[60px]">
            {isFetchingNextPage && (
              <ActivityIndicator size="small" color="#1c64f2" />
            )}
            {isLoading && <ActivityIndicator size="large" color="#1c64f2" />}
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}
