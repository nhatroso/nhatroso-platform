import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '@/src/api/invoice';
import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency } from '@/src/utils/format';
import { CreditCard, ChevronRight, Filter } from '@/src/lib/icons';
import { useState } from 'react';

export default function InvoicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: invoices,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: invoiceService.getMyInvoices,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderStatus = (status: string | null) => {
    const isPaid = status === 'PAID';
    const label = isPaid
      ? t('Invoices.status.paid')
      : t('Invoices.status.unpaid');
    const colorClass = isPaid ? 'bg-success' : 'bg-error';

    return (
      <View className="flex-row items-center bg-muted/5 px-2.5 py-1 rounded-lg">
        <View className={`h-1.5 w-1.5 rounded-full mr-2 ${colorClass}`} />
        <Text className="text-muted text-[10px] font-bold uppercase tracking-wider">
          {label}
        </Text>
      </View>
    );
  };

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
        renderItem={({ item }) => (
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
                    className={
                      item.status === 'PAID' ? 'text-success' : 'text-error'
                    }
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
                  {formatCurrency(item.total_amount)}
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
        )}
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
