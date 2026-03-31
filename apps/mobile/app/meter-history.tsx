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
import { Calendar, FileImage, Hash, X } from '@/src/lib/icons';
import { useMeterHistory } from '@/src/hooks/useMeterHistory';

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
              return (
                <View
                  key={r.id || index}
                  className="bg-white rounded-2xl p-5 border border-border shadow-sm flex-row"
                >
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-1">
                      <Calendar size={14} className="text-primary mr-1.5" />
                      <Text className="text-xs font-bold text-primary uppercase tracking-widest">
                        {t('Services.history.monthYear', {
                          month: d.getMonth() + 1,
                          year: d.getFullYear(),
                        })}
                      </Text>
                    </View>

                    <View className="flex-row items-end mb-3">
                      <Text className="text-3xl font-extrabold text-text leading-none tracking-tight">
                        {r.reading_value}
                      </Text>
                      {unit && (
                        <Text className="text-base font-bold text-muted ml-1 mb-0.5">
                          {unit}
                        </Text>
                      )}
                    </View>

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
