import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { InvoiceDetailScreen } from '@/screens/invoices';

export default function InvoiceDetailRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('Invoices.invoiceDetails') }} />
      <InvoiceDetailScreen />
    </>
  );
}
