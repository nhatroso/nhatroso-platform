import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';

const queryClient = new QueryClient();

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access tabs
      router.replace('/');
    } else if (user && !inAuthGroup) {
      // Redirect to dashboard if authenticated and on login screen
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1c64f2',
        },
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
