import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MeterRequestsScreen } from '@/screens/meters/MeterRequestsScreen';

export default function RequestsPage() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen
        options={{
          title: t('Meters.requestsTitle', 'Yêu cầu nộp chỉ số'),
          headerShown: true,
        }}
      />
      <MeterRequestsScreen />
    </>
  );
}
