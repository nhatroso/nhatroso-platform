import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CreditCard,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
} from '@/src/lib/icons';
import { useAuth } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  useDashboardScreen,
  useServiceLabel,
} from '@/src/hooks/useDashboardScreen';
import { MeterStatusList } from '@/src/features/dashboard/MeterStatusList';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const getServiceLabel = useServiceLabel();
  const { meters, isLoadingMeters, activeRequest, isRequestCompleted } =
    useDashboardScreen();

  return (
    <ScrollView className="flex-1 bg-background p-6">
      <View className="mb-8">
        <Text className="text-3xl font-extrabold text-text tracking-tight">
          {t('Dashboard.tenant.welcome', { name: user?.name || 'Kasper' })}
        </Text>
        <Text className="text-lg font-medium text-muted mt-1">
          {t('Dashboard.tenant.todayOverview')}
        </Text>
      </View>

      {/* Pending Request Alert */}
      {activeRequest && !isRequestCompleted && (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/meter-submission',
              params: { period_month: activeRequest.period_month },
            })
          }
          className="mb-8 bg-primary/10 border border-primary/20 p-5 rounded-3xl flex-row items-center"
        >
          <View className="h-12 w-12 bg-primary/20 rounded-2xl items-center justify-center mr-4">
            <AlertCircle size={28} className="text-primary" />
          </View>
          <View className="flex-1">
            <Text className="text-primary font-bold text-lg">
              {t('Dashboard.tenant.pendingReadingRequest')}
            </Text>
            <Text className="text-primary/70 font-medium">
              {t('Dashboard.tenant.landlordRequestedReadings', {
                month: activeRequest.period_month?.split('-')[1] || '',
                year: activeRequest.period_month?.split('-')[0] || '',
              })}
            </Text>
          </View>
          <ChevronRight size={20} className="text-primary/50" />
        </TouchableOpacity>
      )}

      {/* Stats Grid */}
      <View className="flex-row flex-wrap gap-4 mb-8">
        <View className="flex-1 min-w-[45%] bg-background p-5 rounded-2xl border border-border shadow-sm">
          <View className="h-12 w-12 bg-primary/10 rounded-xl items-center justify-center mb-4">
            <CreditCard size={24} className="text-primary" />
          </View>
          <Text className="text-muted text-xs font-bold uppercase tracking-widest">
            {t('Dashboard.tenant.rentBalance')}
          </Text>
          <Text className="text-text text-2xl font-extrabold mt-1">$1,200</Text>
        </View>

        <View className="flex-1 min-w-[45%] bg-background p-5 rounded-2xl border border-border shadow-sm">
          <View className="h-12 w-12 bg-error/10 rounded-xl items-center justify-center mb-4">
            <AlertCircle size={24} className="text-error" />
          </View>
          <Text className="text-muted text-xs font-bold uppercase tracking-widest">
            {t('Dashboard.tenant.dueDate')}
          </Text>
          <Text className="text-error text-2xl font-extrabold mt-1">
            Mar 25
          </Text>
        </View>
      </View>

      {/* Meter Status */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-text mb-4">
          {t('Dashboard.tenant.metersStatus')}
        </Text>
        {isLoadingMeters ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <MeterStatusList
            meters={meters}
            isLoadingMeters={isLoadingMeters}
            getServiceLabel={getServiceLabel}
          />
        )}
      </View>

      {/* Quick Actions */}
      <Text className="text-xl font-bold text-text mb-5">
        {t('Dashboard.tenant.quickActions')}
      </Text>
      <View className="gap-y-4 mb-8">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/meter-submission',
              params: { period_month: activeRequest?.period_month },
            })
          }
          className="flex-row items-center justify-between bg-background p-5 rounded-2xl border border-border shadow-sm active:bg-input"
        >
          <View className="flex-row items-center">
            <View className="h-10 w-10 bg-success/10 rounded-xl items-center justify-center mr-4">
              <CheckCircle2 size={20} className="text-success" />
            </View>
            <Text className="text-text font-bold text-base">
              {t('Dashboard.tenant.reportMeterReading')}
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
              {t('Dashboard.tenant.contactLandlord')}
            </Text>
          </View>
          <ChevronRight size={20} className="text-icon" />
        </TouchableOpacity>
      </View>

      <View className="h-20" />
    </ScrollView>
  );
}
