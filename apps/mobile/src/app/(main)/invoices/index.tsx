import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { InvoicesScreen } from '@/screens/invoices';

export default function InvoicesRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('Invoices.title') }} />
      <InvoicesScreen />
    </>
  );
}
