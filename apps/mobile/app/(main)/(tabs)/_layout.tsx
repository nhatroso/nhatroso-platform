import { Tabs } from 'expo-router';
import { Home, Bed, User } from '@/src/lib/icons';

import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1c64f2',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1c64f2',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('Dashboard.tabs.dashboard'),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="room"
        options={{
          title: t('Dashboard.tabs.room'),
          tabBarIcon: ({ color }) => <Bed size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('Dashboard.tabs.profile'),
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
