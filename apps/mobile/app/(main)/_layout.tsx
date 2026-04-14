import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

function CustomHeader({ navigation, options, route }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: '#1c64f2' }}>
      <View className="h-16 flex-row items-center px-2">
        {navigation.canGoBack() && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 mr-2"
          >
            <ChevronLeft size={28} color="#ffffff" />
          </TouchableOpacity>
        )}
        <Text className="text-white text-xl font-extrabold flex-1">
          {options.title || route.name}
        </Text>
      </View>
    </View>
  );
}

export default function MainLayout() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) return null;

  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerStyle: {
          backgroundColor: '#1c64f2',
        },
        headerShadowVisible: false,
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="invoices/index"
        options={{ title: t('Invoices.title') }}
      />
      <Stack.Screen
        name="invoices/[id]"
        options={{ title: t('Invoices.invoiceDetails') }}
      />
    </Stack>
  );
}
