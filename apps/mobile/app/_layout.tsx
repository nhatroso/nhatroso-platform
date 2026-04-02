import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import '../global.css';
import '@/src/lib/i18n';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

const queryClient = new QueryClient();

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

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isRootIndex =
      !segments[0] || segments[0] === 'index' || segments[0] === '(index)';

    if (!user && !isRootIndex) {
      // Redirect to login if not authenticated and trying to access private screens
      router.replace('/');
    } else if (user && isRootIndex) {
      // Redirect to dashboard if authenticated and on login screen
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, segments, router]);

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
      <Stack.Screen
        name="index"
        options={{ title: 'Login', headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
