import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Bed, MapPin, Hash, Info } from '@/src/lib/icons';
import { useQuery } from '@tanstack/react-query';
import { roomService } from '@/src/api/room';
import { useTranslation } from 'react-i18next';

export default function RoomScreen() {
  const { t } = useTranslation();
  const {
    data: room,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my-room'],
    queryFn: roomService.getMyRoom,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    );
  }

  if (error || !room) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-input mb-6">
          <Info size={40} className="text-muted" />
        </View>
        <Text className="text-2xl font-bold text-text mb-2">
          {t('Dashboard.room.noInfoTitle')}
        </Text>
        <Text className="text-center text-muted leading-6">
          {t('Dashboard.room.noInfoDesc')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-6">
      <View className="mb-8 overflow-hidden rounded-2xl bg-background border border-border shadow-sm">
        <View className="bg-primary p-12 items-center">
          <Bed size={64} color="#fff" />
          <Text className="mt-4 text-3xl font-extrabold text-white tracking-tight">
            {t('Dashboard.room.roomNumber', { code: room.code })}
          </Text>
        </View>
        <View className="p-6 gap-y-6">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-input border border-border">
              <MapPin size={24} className="text-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-muted uppercase tracking-widest">
                {t('Dashboard.room.address')}
              </Text>
              <Text className="text-base font-bold text-text mt-0.5">
                {room.room_address}
              </Text>
              <Text className="text-sm text-muted">{room.building_name}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-input border border-border">
              <Hash size={24} className="text-primary" />
            </View>
            <View>
              <Text className="text-xs font-bold text-muted uppercase tracking-widest">
                {t('Dashboard.room.floor')}
              </Text>
              <Text className="text-base font-bold text-text mt-0.5">
                {room.floor_name || t('Dashboard.room.groundFloor')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mb-10 rounded-2xl bg-background p-6 border border-border shadow-sm">
        <Text className="mb-6 text-xl font-bold text-text">
          {t('Dashboard.room.monthlyCosts')}
        </Text>
        <View className="gap-y-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted font-medium text-lg">
              {t('Dashboard.room.roomRent')}
            </Text>
            <Text className="font-bold text-text text-lg">
              {Number(room.monthly_rent).toLocaleString('vi-VN')}{' '}
              {t('Dashboard.room.currency')}
            </Text>
          </View>

          <View className="h-px bg-border my-1" />

          {room.services.map((service, index) => (
            <View key={index} className="flex-row justify-between items-center">
              <View>
                <Text className="text-muted font-medium text-base">
                  {service.name}
                </Text>
                <Text className="text-xs text-muted/60">
                  {t('Dashboard.room.perUnit', {
                    unit: t(`Services.Unit_${service.unit}`, service.unit),
                  })}
                </Text>
              </View>
              <Text className="font-bold text-text text-base">
                {Number(service.unit_price).toLocaleString('vi-VN')}{' '}
                {t('Dashboard.room.currency')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
