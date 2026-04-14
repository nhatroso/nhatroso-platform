import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '@/src/api/invoice';
import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency } from '@/src/utils/format';
import { CreditCard, Clock, ArrowRight } from '@/src/lib/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoiceDetail(Number(id)),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1c64f2" />
      </View>
    );
  }

  if (!invoice) return null;

  const isUnpaid = invoice.status === 'UNPAID';

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="bg-[#1c64f2] pt-12 pb-10 px-6 rounded-b-[40px] shadow-sm">
          <View className="items-center mb-6">
            <View className="h-16 w-16 bg-white/20 rounded-2xl items-center justify-center mb-5">
              <CreditCard size={32} color="#ffffff" />
            </View>
            <Text className="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-2">
              {t('Invoices.totalAmount')}
            </Text>
            <Text className="text-white font-black text-4xl tracking-tighter">
              {formatCurrency(Number(invoice.total_amount))}
            </Text>
          </View>

          <View className="flex-row items-center justify-center gap-x-3">
            <View className="flex-row items-center bg-white/15 px-4 py-2 rounded-2xl">
              <View
                className={`h-2 w-2 rounded-full mr-2 ${invoice.status === 'PAID' ? 'bg-success' : 'bg-error'}`}
              />
              <Text className="text-white text-[11px] font-black uppercase tracking-wider">
                {invoice.status === 'PAID'
                  ? t('Invoices.status.paid')
                  : t('Invoices.status.unpaid')}
              </Text>
            </View>
            <View className="flex-row items-center bg-white/15 px-4 py-2 rounded-2xl">
              <Clock size={14} color="#ffffff" className="mr-2" />
              <Text className="text-white text-[11px] font-black uppercase tracking-wider">
                {formatDate(invoice.due_date || invoice.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 -mt-6 gap-y-6">
          {/* Details Card */}
          <View className="bg-white p-6 rounded-[32px] border border-border/50 shadow-sm">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-black text-text tracking-tight">
                {t('Invoices.details')}
              </Text>
              <View className="bg-primary/5 px-2.5 py-1 rounded-lg">
                <Text className="text-primary text-[10px] font-bold">
                  #{invoice.id}
                </Text>
              </View>
            </View>

            <View className="gap-y-6">
              {invoice.details.map((item, idx) => (
                <View
                  key={idx}
                  className="flex-row justify-between items-start"
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-text font-bold text-base leading-tight">
                      {item.description}
                    </Text>
                  </View>
                  <Text className="text-text font-black text-base">
                    {formatCurrency(Number(item.amount))}
                  </Text>
                </View>
              ))}

              <View className="border-t border-border/50 pt-6 mt-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted font-black uppercase tracking-widest text-[11px]">
                    {t('Invoices.totalAmount')}
                  </Text>
                  <Text className="text-[#1c64f2] font-black text-2xl tracking-tight">
                    {formatCurrency(Number(invoice.total_amount))}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer Card */}
          <View className="bg-white p-5 rounded-2xl border border-border/30 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-8 w-8 bg-muted/5 rounded-lg items-center justify-center mr-3">
                <Clock size={16} className="text-muted" />
              </View>
              <View>
                <Text className="text-muted text-[10px] font-bold uppercase tracking-widest">
                  {t('Invoices.createdAt')}
                </Text>
                <Text className="text-text font-bold text-xs mt-0.5">
                  {formatDate(invoice.created_at)}
                </Text>
              </View>
            </View>
            <ArrowRight size={16} className="text-muted/30" />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {isUnpaid && (
        <View
          className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 border-t border-border"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <TouchableOpacity
            className="bg-[#1c64f2] h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/30"
            activeOpacity={0.9}
          >
            <Text className="text-white font-black text-lg mr-2 uppercase tracking-tight">
              {t('Invoices.payNow')}
            </Text>
            <ArrowRight size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
