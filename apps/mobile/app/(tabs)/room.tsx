import { View, Text, ScrollView } from 'react-native';
import { Bed, MapPin, Hash, Ruler } from '@/src/lib/icons';

export default function RoomScreen() {
  return (
    <ScrollView className="flex-1 bg-background p-6">
      <View className="mb-8 overflow-hidden rounded-2xl bg-background border border-border shadow-sm">
        <View className="bg-primary p-10 items-center">
          <Bed size={64} color="#fff" />
          <Text className="mt-4 text-3xl font-extrabold text-white tracking-tight">
            Room 101
          </Text>
        </View>
        <View className="p-6 gap-y-6">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-input border border-border">
              <MapPin size={24} className="text-primary" />
            </View>
            <View>
              <Text className="text-xs font-bold text-muted uppercase tracking-widest">
                Address
              </Text>
              <Text className="text-base font-bold text-text mt-0.5">
                123 Street, District 1, HCM
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-input border border-border">
              <Hash size={24} className="text-primary" />
            </View>
            <View>
              <Text className="text-xs font-bold text-muted uppercase tracking-widest">
                Floor
              </Text>
              <Text className="text-base font-bold text-text mt-0.5">
                1st Floor
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-input border border-border">
              <Ruler size={24} className="text-primary" />
            </View>
            <View>
              <Text className="text-xs font-bold text-muted uppercase tracking-widest">
                Area
              </Text>
              <Text className="text-base font-bold text-text mt-0.5">
                25 sqm
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mb-6 rounded-2xl bg-background p-6 border border-border shadow-sm">
        <Text className="mb-5 text-xl font-bold text-text">
          Monthly Expenses
        </Text>
        <View className="gap-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted font-medium text-base">Rent</Text>
            <Text className="font-bold text-text text-base">3,000,000 VND</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-muted font-medium text-base">
              Electricity (per kWh)
            </Text>
            <Text className="font-bold text-text text-base">3,500 VND</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-muted font-medium text-base">
              Water (per m3)
            </Text>
            <Text className="font-bold text-text text-base">20,000 VND</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
