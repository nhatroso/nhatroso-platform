import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Zap,
  Droplets,
  CheckCircle2,
} from '@/src/lib/icons';
import { useAuth } from '@/src/context/AuthContext';
import { meterService } from '@/src/api/meter';
import { roomService } from '@/src/api/room';
import { useTranslation } from 'react-i18next';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: meters, isLoading: isLoadingMeters } = useQuery({
    queryKey: ['my-meters'],
    queryFn: meterService.getMyMeters,
  });

  const { data: readingRequests } = useQuery({
    queryKey: ['my-reading-requests'],
    queryFn: meterService.getReadingRequests,
  });

  const { data: room } = useQuery({
    queryKey: ['my-room'],
    queryFn: roomService.getMyRoom,
  });

  const activeRequest = Array.isArray(readingRequests)
    ? readingRequests.find((r) => r.status === 'OPEN')
    : null;

  const requiredServices = room?.services
    ? room.services.filter((s: any) => {
        const name = s.name?.toLowerCase() || '';
        const isElec = name.includes('điện') || name.includes('elec');
        const isWater = name.includes('nước') || name.includes('water');
        return isElec || isWater;
      })
    : [];

  const completedServicesCount = requiredServices.filter((s: any) => {
    const sMeter = (meters || []).find(
      (m: any) => m.service_id === s.service_id,
    );
    return sMeter?.latest_reading_date
      ? new Date(sMeter.latest_reading_date).getMonth() ===
          (activeRequest?.month || new Date().getMonth() + 1) - 1 &&
          new Date(sMeter.latest_reading_date).getFullYear() ===
            (activeRequest?.year || new Date().getFullYear())
      : false;
  }).length;

  const isRequestCompleted =
    requiredServices.length > 0 &&
    completedServicesCount === requiredServices.length;

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
          onPress={() => router.push('/meter-submission')}
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
                month: activeRequest.month,
                year: activeRequest.year,
              })}
            </Text>
          </View>
          <ChevronRight size={20} className="text-primary/50" />
        </TouchableOpacity>
      )}

      {activeRequest && isRequestCompleted && (
        <View className="mb-8 bg-success/10 border border-success/20 p-5 rounded-3xl flex-row items-center">
          <View className="h-12 w-12 bg-success/20 rounded-2xl items-center justify-center mr-4">
            <CheckCircle2 size={28} className="text-success" />
          </View>
          <View className="flex-1">
            <Text className="text-success font-bold text-lg">
              {t('Dashboard.tenant.readingCompleted')}
            </Text>
            <Text className="text-success/70 font-medium">
              {t('Dashboard.tenant.readingCompletedMessage', {
                month: activeRequest.month,
                year: activeRequest.year,
              })}
            </Text>
          </View>
        </View>
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

      {/* Meter Status (Preview) */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-text mb-4">
          {t('Dashboard.tenant.metersStatus')}
        </Text>
        {isLoadingMeters ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <View className="gap-y-3">
            {Array.isArray(meters) &&
              meters.map((m) => {
                const isElectricity =
                  m.service_id.includes('elec') ||
                  m.serial_number?.toLowerCase().includes('e');
                const isSubmittedThisMonth = m.latest_reading_date
                  ? new Date(m.latest_reading_date).getMonth() ===
                      new Date().getMonth() &&
                    new Date(m.latest_reading_date).getFullYear() ===
                      new Date().getFullYear()
                  : false;

                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() =>
                      router.push({
                        pathname: '/meter-history',
                        params: {
                          meterId: m.id,
                          serviceName:
                            m.service_name ||
                            (isElectricity
                              ? t('Dashboard.tenant.electricity')
                              : t('Dashboard.tenant.water')),
                          unit:
                            m.service_unit || (isElectricity ? 'kWh' : 'm³'),
                        },
                      })
                    }
                    className="bg-white p-4 rounded-2xl border border-border shadow-sm mb-3 active:bg-input"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View
                          className={`h-8 w-8 rounded-full items-center justify-center mr-3 ${isElectricity ? 'bg-warning/10' : 'bg-primary/10'}`}
                        >
                          {isElectricity ? (
                            <Zap size={16} className="text-warning" />
                          ) : (
                            <Droplets size={16} className="text-primary" />
                          )}
                        </View>
                        <Text className="text-text font-bold text-sm">
                          {m.service_name ||
                            (isElectricity
                              ? t('Dashboard.tenant.electricity')
                              : t('Dashboard.tenant.water'))}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <View
                          className={`h-2 w-2 rounded-full mr-1.5 ${isSubmittedThisMonth ? 'bg-success' : 'bg-warning'}`}
                        />
                        <Text className="text-xs text-muted font-medium mr-1.5">
                          {isSubmittedThisMonth
                            ? t('Dashboard.tenant.submitted')
                            : t('Dashboard.tenant.notSubmitted')}
                        </Text>
                        <ChevronRight size={16} className="text-muted/50" />
                      </View>
                    </View>

                    <View className="bg-background rounded-xl p-3 flex-row items-center justify-between">
                      <View>
                        <Text className="text-muted text-[10px] uppercase font-bold mb-0.5">
                          {t('Dashboard.tenant.latestReading')}
                        </Text>
                        <View className="flex-row items-end">
                          <Text className="text-text font-bold text-lg leading-none">
                            {m.latest_reading || m.initial_reading}
                          </Text>
                          <Text className="text-muted text-xs font-medium ml-1 mb-0.5">
                            {m.service_unit || (isElectricity ? 'kWh' : 'm³')}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-muted text-[10px] uppercase font-bold mb-0.5">
                          {t('Dashboard.tenant.recordedAt')}
                        </Text>
                        <Text className="text-text font-medium text-xs">
                          {m.latest_reading_date
                            ? new Date(
                                m.latest_reading_date,
                              ).toLocaleDateString()
                            : t('Dashboard.tenant.pendingUpdate')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </View>

      {/* Main Actions */}
      <Text className="text-xl font-bold text-text mb-5">
        {t('Dashboard.tenant.quickActions')}
      </Text>

      <View className="gap-y-4 mb-8">
        <TouchableOpacity
          onPress={() => router.push('/meter-submission')}
          className="flex-row items-center justify-between bg-background p-5 rounded-2xl border border-border shadow-sm active:bg-input"
        >
          <View className="flex-row items-center">
            <View className="h-10 w-10 bg-success/10 rounded-xl items-center justify-center mr-4">
              <Zap size={20} className="text-success" />
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
