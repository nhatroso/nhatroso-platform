import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, Droplets, Zap, FileImage, Hash } from '@/assets/icons';
import { useMetersHistory } from './hooks/useMetersHistory';
import { formatDate } from '@/utils/format';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useLocalSearchParams } from 'expo-router';

export function MetersHistoryScreen() {
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type?: string }>();

  const {
    data,
    isLoading,
    refreshing,
    onRefresh,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMetersHistory(type);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderReadingItem = (item: any) => {
    const isElectric =
      item.service_name?.toLowerCase().includes('điện') ||
      item.service_name?.toLowerCase().includes('electric');
    const Icon = isElectric ? Zap : Droplets;
    const iconColor = isElectric ? 'text-warning' : 'text-primary';
    const bgColor = isElectric ? 'bg-warning/10' : 'bg-primary/10';

    return (
      <View className="bg-white rounded-2xl p-5 border border-border shadow-sm mb-4 flex-row">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center mb-2">
            <View
              className={`${bgColor} w-8 h-8 rounded-lg items-center justify-center mr-3`}
            >
              <Icon size={16} className={iconColor} />
            </View>
            <View>
              <Text className="text-base font-bold text-text">
                {item.service_name}
              </Text>
              <Text className="text-xs font-medium text-muted">
                {item.period_month}
              </Text>
            </View>
          </View>
          <View className="flex-row items-baseline mt-1">
            <Text className="text-3xl font-black text-text tracking-tighter">
              {item.reading_value} {item.service_unit}
            </Text>
            {item.usage !== null && item.usage !== undefined && (
              <View className="ml-3 bg-green-50 px-2 py-1 rounded-lg">
                <Text className="text-sm font-bold text-green-600">
                  +{item.usage}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-muted font-medium mt-2">
            {formatDate(item.reading_date)}
          </Text>
        </View>

        {item.image_url ? (
          <View className="w-24 h-24 rounded-xl overflow-hidden border border-border">
            <Image
              source={{ uri: item.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute bottom-1 right-1 bg-black/50 rounded-md p-1">
              <FileImage size={12} color="white" />
            </View>
          </View>
        ) : (
          <View className="w-24 h-24 rounded-xl bg-input/20 border border-border border-dashed items-center justify-center">
            <Hash size={24} className="text-muted/50" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerClassName="p-6 gap-y-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1c64f2"
          />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-2xl font-extrabold text-text tracking-tight">
              {type === 'ELECTRIC'
                ? t('Meters.history.electricTitle', 'Lịch sử nộp Điện')
                : type === 'WATER'
                  ? t('Meters.history.waterTitle', 'Lịch sử nộp Nước')
                  : t('Meters.title')}
            </Text>
          </View>
        }
        renderItem={({ item }) => renderReadingItem(item)}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Calendar}
              title={t('Meters.empty')}
              description={t('Meters.empty_desc')}
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
// trigger rebuild
