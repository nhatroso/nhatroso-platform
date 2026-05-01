import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/assets/icons';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { meterService } from '@/services/meter.service';
import { formatDate } from '@/utils/format';
import { StatusBadge } from '@/components/core/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AppCard } from '@/components/core/AppCard';

export function MeterRequestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const query = useInfiniteQuery({
    queryKey: ['meters-requests'],
    queryFn: async ({ pageParam = 1 }) => {
      return await meterService.getReadingRequests({
        page: pageParam,
        limit: 10,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 10) {
        return undefined;
      }
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    query;

  const refreshing = query.isRefetching && !query.isFetchingNextPage;
  const onRefresh = async () => {
    await query.refetch();
  };

  const requests = data?.pages.flat() ?? [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const getStatusProps = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUBMITTED':
        return {
          type: 'success' as const,
          label: t('Meters.Status_COMPLETED'),
        };
      case 'PARTIAL':
        return { type: 'info' as const, label: t('Meters.Status_PARTIAL') };
      case 'OPEN':
        return { type: 'warning' as const, label: t('Meters.Status_OPEN') };
      case 'OVERDUE':
        return { type: 'error' as const, label: t('Meters.Status_OVERDUE') };
      default:
        return { type: 'warning' as const, label: status };
    }
  };

  const renderRequestItem = (item: any) => {
    const statusProps = getStatusProps(item.status);

    return (
      <AppCard
        className="mb-4"
        onPress={
          item.status === 'OPEN' || item.status === 'PARTIAL'
            ? () =>
                router.push({
                  pathname: '/meters/submission',
                  params: { period_month: item.period_month },
                })
            : undefined
        }
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="bg-primary/5 px-2.5 py-1 rounded-lg flex-row items-center">
            <Calendar size={12} className="text-primary mr-1.5" />
            <Text className="text-[11px] font-black text-primary tracking-wider">
              {item.period_month}
            </Text>
          </View>
          <StatusBadge status={statusProps.type} label={statusProps.label} />
        </View>
        <Text className="text-lg font-black text-text tracking-tight">
          {t('Meters.history.requestLabel', 'Yêu cầu nộp chỉ số')}
        </Text>
        <Text className="text-xs text-muted font-medium mt-2">
          {t('Meters.history.dueDate', 'Hạn chót')}: {formatDate(item.due_date)}
        </Text>
      </AppCard>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={requests}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerClassName="p-6 gap-y-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {t('Meters.requestsTitle', 'Yêu cầu nộp chỉ số')}
            </Text>
          </View>
        }
        renderItem={({ item }) => renderRequestItem(item)}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Calendar}
              title={t('Meters.requestsEmpty', 'Chưa có yêu cầu')}
              description={t(
                'Meters.requestsEmptyDesc',
                'Bạn chưa có yêu cầu nộp chỉ số nào.',
              )}
            />
          ) : null
        }
        ListFooterComponent={
          <View className="py-4 items-center justify-center min-h-[60px]">
            {isFetchingNextPage && (
              <ActivityIndicator size="small" color="#2563EB" />
            )}
            {isLoading && <ActivityIndicator size="large" color="#2563EB" />}
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}
