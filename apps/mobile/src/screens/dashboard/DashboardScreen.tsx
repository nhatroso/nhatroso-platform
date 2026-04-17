import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CreditCard,
  AlertCircle,
  MessageSquare,
  ChevronRight,
} from '@/assets/icons';

import { useApp } from '@/context';
import { useTranslation } from 'react-i18next';
import {
  useDashboardScreen,
  useServiceLabel,
} from './hooks/useDashboardScreen';
import { MeterStatusList } from './components/MeterStatusList';
import { formatCurrency, formatDate } from '@/utils/format';
import { DashboardAlert } from './components/DashboardAlert';

export function DashboardScreen() {
  const { user } = useApp();
  const router = useRouter();
  const { t } = useTranslation();
  const getServiceLabel = useServiceLabel();
  const {
    meters,
    isLoadingMeters,
    activeRequest,
    isRequestCompleted,
    latestUnpaidInvoice,
    totalUnpaidAmount,
    isLoadingInvoices,
    refetchAll,
  } = useDashboardScreen();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  }, [refetchAll]);

  return (
    <ScrollView
      className="flex-1 bg-background p-6"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
        <DashboardAlert
          type="primary"
          icon={AlertCircle}
          title={t('Dashboard.tenant.pendingReadingRequest')}
          description={t('Dashboard.tenant.landlordRequestedReadings', {
            month: activeRequest.period_month?.split('-')[1] || '',
            year: activeRequest.period_month?.split('-')[0] || '',
          })}
          onPress={() =>
            router.push({
              pathname: '/meters/submission',
              params: { period_month: activeRequest.period_month },
            })
          }
        />
      )}

      {/* Unpaid Invoice Alert */}
      {latestUnpaidInvoice && (
        <DashboardAlert
          type="error"
          icon={CreditCard}
          title={t('Dashboard.tenant.unpaidInvoiceAlert')}
          description={t('Dashboard.tenant.invoiceTotalDue', {
            amount: formatCurrency(totalUnpaidAmount),
          })}
          onPress={() => router.push('/invoices')}
        />
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
          {isLoadingInvoices ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              className="mt-2 self-start"
            />
          ) : (
            <Text className="text-text text-2xl font-extrabold mt-1">
              {formatCurrency(totalUnpaidAmount)}
            </Text>
          )}
        </View>

        <View className="flex-1 min-w-[45%] bg-background p-5 rounded-2xl border border-border shadow-sm">
          <View className="h-12 w-12 bg-error/10 rounded-xl items-center justify-center mb-4">
            <AlertCircle size={24} className="text-error" />
          </View>
          <Text className="text-muted text-xs font-bold uppercase tracking-widest">
            {t('Dashboard.tenant.dueDate')}
          </Text>
          {isLoadingInvoices ? (
            <ActivityIndicator
              size="small"
              color="#ef4444"
              className="mt-2 self-start"
            />
          ) : (
            <Text className="text-error text-2xl font-extrabold mt-1">
              {latestUnpaidInvoice
                ? formatDate(
                    latestUnpaidInvoice.due_date ||
                      latestUnpaidInvoice.created_at,
                  )
                : t('Dashboard.tenant.noDue')}
            </Text>
          )}
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
            activeRequest={activeRequest}
          />
        )}
      </View>

      {/* Quick Actions */}
      <Text className="text-xl font-bold text-text mb-5">
        {t('Dashboard.tenant.quickActions')}
      </Text>
      <View className="gap-y-4 mb-8">
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
