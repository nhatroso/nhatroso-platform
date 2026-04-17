import React from 'react';
import { View, Text } from 'react-native';
import { Info } from '@/assets/icons';
import { useTranslation } from 'react-i18next';

interface PaymentInfoCardProps {
  accountNo: string;
  accountName: string;
  content: string;
}

export function PaymentInfoCard({
  accountNo,
  accountName,
  content,
}: PaymentInfoCardProps) {
  const { t } = useTranslation();

  return (
    <View className="bg-muted/5 p-6 rounded-3xl border border-border/30">
      <View className="flex-row items-center mb-4">
        <Info size={18} className="text-muted mr-3" />
        <Text className="text-text font-bold text-base">
          {t('Invoices.payment.transferInfo')}
        </Text>
      </View>

      <View className="gap-y-4">
        <View>
          <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-0.5">
            {t('Invoices.payment.bank')}
          </Text>
          <Text className="text-text font-bold text-sm">
            TPBank (Ngân hàng Tiên Phong)
          </Text>
        </View>
        <View>
          <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-0.5">
            {t('Invoices.payment.accountNo')}
          </Text>
          <Text className="text-text font-bold text-sm">{accountNo}</Text>
        </View>
        <View>
          <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-0.5">
            {t('Invoices.payment.accountName')}
          </Text>
          <Text className="text-text font-bold text-sm">{accountName}</Text>
        </View>
        <View>
          <Text className="text-muted text-[10px] font-bold uppercase tracking-widest mb-0.5">
            {t('Invoices.payment.content')}
          </Text>
          <Text className="text-primary font-black text-sm">{content}</Text>
        </View>
      </View>
    </View>
  );
}
