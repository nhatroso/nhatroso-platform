import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Calendar, FileImage, Hash, X, TrendingUp } from '@/assets/icons';
import { useMeterHistory } from '../../../screens/meters/hooks';

export default function MeterHistoryScreen() {
  const { t } = useTranslation();
  const {
    serviceName,
    unit,
    isLoading,
    sortedReadings,
    selectedImage,
    setSelectedImage,
    formatDate,
  } = useMeterHistory();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ title: t('Services.history.title') }} />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: t('Services.history.title'),
          headerBackTitle: '',
          headerShadowVisible: false,
        }}
      />

      <ScrollView className="flex-1 p-6">
        <View className="mb-8 mt-2">
          <Text className="text-3xl font-extrabold text-text tracking-tight">
            {serviceName}
          </Text>
          <Text className="text-lg font-medium text-muted mt-1">
            {t('Services.history.title')}
          </Text>
        </View>

        {sortedReadings.length === 0 ? (
          <View className="bg-input/30 p-8 rounded-3xl border border-border items-center justify-center mt-4">
            <Calendar size={48} className="text-muted mb-4" />
            <Text className="text-text font-bold text-lg mb-1">
              {t('Services.history.noReadings')}
            </Text>
          </View>
        ) : (
          <View className="gap-y-4">
            {sortedReadings.map((r, index) => {
              const d = new Date(r.reading_date);
              let displayMonth = d.getMonth() + 1;
              let displayYear = d.getFullYear();

              if (r.period_month) {
                const parts = r.period_month.split('-');
                if (parts.length === 2) {
                  displayYear = parseInt(parts[0], 10);
                  displayMonth = parseInt(parts[1], 10);
                }
              }

              return (
                <View
                  key={r.id || index}
                  className="bg-white rounded-2xl p-5 border border-border shadow-sm flex-row"
                >
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-1">
                      <View className="bg-primary/10 px-2 py-0.5 rounded-md flex-row items-center mr-2">
                        <Calendar size={10} className="text-primary mr-1" />
                        <Text className="text-[10px] font-bold text-primary uppercase tracking-tight">
                          {t('Services.history.monthYear', {
                            month: displayMonth,
                            year: displayYear,
                          })}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-baseline mt-1.5 mb-1">
                      <Text className="text-4xl font-black text-text tracking-tighter">
                        {r.reading_value} {unit}
                      </Text>
                    </View>

                    {!!r.usage && Number(r.usage) > 0 && (
                      <View className="flex-row items-center mt-1 mb-2">
                        <View className="bg-green-500/10 px-2.5 py-1 rounded-full flex-row items-center">
                          <TrendingUp
                            size={12}
                            className="text-green-600 mr-1.5"
                          />
                          <Text className="text-xs font-black text-green-600">
                            {r.usage} {unit}
                          </Text>
                        </View>
                      </View>
                    )}

                    <Text className="text-xs text-muted font-medium">
                      {t('Services.history.recordedAt')}:{' '}
                      {formatDate(r.reading_date)}
                    </Text>
                  </View>

                  {r.image_url ? (
                    <TouchableOpacity
                      onPress={() => setSelectedImage(r.image_url)}
                      className="w-24 h-24 rounded-xl overflow-hidden border border-border"
                    >
                      <Image
                        source={{ uri: r.image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute bottom-1 right-1 bg-black/50 rounded-md p-1">
                        <FileImage size={12} color="white" />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View className="w-24 h-24 rounded-xl bg-input/20 border border-border border-dashed items-center justify-center">
                      <Hash size={24} className="text-muted/50" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View className="h-12" />
      </ScrollView>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View className="flex-1 bg-black relative items-center justify-center">
          <TouchableOpacity
            className="absolute top-12 right-6 z-10 bg-white/20 p-3 rounded-full"
            onPress={() => setSelectedImage(null)}
          >
            <X size={24} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-[80%]"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
