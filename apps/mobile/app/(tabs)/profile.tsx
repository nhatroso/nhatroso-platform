import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Settings, LogOut, ChevronRight, HelpCircle } from '@/lib/icons';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="items-center bg-background p-10 mb-6 shadow-sm border-b border-border">
        <View className="mb-4 h-28 w-28 items-center justify-center rounded-full bg-input border-4 border-background">
          <User size={64} className="text-icon" />
        </View>
        <Text className="text-3xl font-extrabold text-text tracking-tight">
          Guest Tenant
        </Text>
        <Text className="text-muted font-medium text-base mt-1">
          guest@nhatroso.com
        </Text>
        <Pressable className="mt-6 rounded-xl border border-border px-8 py-2.5 active:bg-input">
          <Text className="text-sm font-bold text-text">Edit Profile</Text>
        </Pressable>
      </View>

      <View className="px-6 gap-y-4">
        <Pressable className="flex-row items-center justify-between rounded-2xl bg-background p-5 shadow-sm border border-border active:bg-input">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Settings size={24} className="text-primary" />
            </View>
            <Text className="font-bold text-text text-base">
              Account Settings
            </Text>
          </View>
          <ChevronRight size={20} className="text-icon" />
        </Pressable>

        <Pressable className="flex-row items-center justify-between rounded-2xl bg-background p-5 shadow-sm border border-border active:bg-input">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <HelpCircle size={24} className="text-success" />
            </View>
            <Text className="font-bold text-text text-base">
              Help & Support
            </Text>
          </View>
          <ChevronRight size={20} className="text-icon" />
        </Pressable>

        <Pressable
          className="flex-row items-center justify-between rounded-2xl bg-background p-5 shadow-sm border border-border active:bg-input"
          onPress={() => router.replace('/')}
        >
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-error/10">
              <LogOut size={24} className="text-error" />
            </View>
            <Text className="font-bold text-error text-base">Sign Out</Text>
          </View>
        </Pressable>
      </View>

      <View className="mt-12 items-center pb-12">
        <Text className="text-xs font-bold text-secondary uppercase tracking-widest">
          Version 1.0.0 (Flowbite)
        </Text>
      </View>
    </ScrollView>
  );
}
