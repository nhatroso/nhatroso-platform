import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  CreditCard,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Zap,
} from '@/lib/icons';

export default function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-background p-6">
      <View className="mb-8">
        <Text className="text-3xl font-extrabold text-text tracking-tight">
          Good morning, Kasper
        </Text>
        <Text className="text-lg font-medium text-muted mt-1">
          Here&apos;s what&apos;s happening today
        </Text>
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap gap-4 mb-8">
        <View className="flex-1 min-w-[45%] bg-background p-5 rounded-2xl border border-border shadow-sm">
          <View className="h-12 w-12 bg-primary/10 rounded-xl items-center justify-center mb-4">
            <CreditCard size={24} className="text-primary" />
          </View>
          <Text className="text-muted text-xs font-bold uppercase tracking-widest">
            Rent Balance
          </Text>
          <Text className="text-text text-2xl font-extrabold mt-1">$1,200</Text>
        </View>

        <View className="flex-1 min-w-[45%] bg-background p-5 rounded-2xl border border-border shadow-sm">
          <View className="h-12 w-12 bg-error/10 rounded-xl items-center justify-center mb-4">
            <AlertCircle size={24} className="text-error" />
          </View>
          <Text className="text-muted text-xs font-bold uppercase tracking-widest">
            Due Date
          </Text>
          <Text className="text-error text-2xl font-extrabold mt-1">
            Mar 25
          </Text>
        </View>
      </View>

      {/* Main Actions */}
      <Text className="text-xl font-bold text-text mb-5">Quick Actions</Text>

      <View className="gap-y-4 mb-8">
        <TouchableOpacity className="flex-row items-center justify-between bg-background p-5 rounded-2xl border border-border shadow-sm active:bg-input">
          <View className="flex-row items-center">
            <View className="h-10 w-10 bg-success/10 rounded-xl items-center justify-center mr-4">
              <Zap size={20} className="text-success" />
            </View>
            <Text className="text-text font-bold text-base">
              Report Meter Reading
            </Text>
          </View>
          <ChevronRight size={20} className="text-icon" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center justify-between bg-background p-5 rounded-2xl border border-border shadow-sm active:bg-input">
          <View className="flex-row items-center">
            <View className="h-10 w-10 bg-warning/10 rounded-xl items-center justify-center mr-4">
              <MessageSquare size={20} className="text-warning" />
            </View>
            <Text className="text-text font-bold text-base">
              Contact Landlord
            </Text>
          </View>
          <ChevronRight size={20} className="text-icon" />
        </TouchableOpacity>
      </View>

      <View className="h-20" />
    </ScrollView>
  );
}
