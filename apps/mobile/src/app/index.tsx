import { Redirect } from 'expo-router';
import { useApp } from '@/context';

export default function RootIndex() {
  const { user, isLoading } = useApp();

  if (isLoading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(main)/(tabs)/dashboard" />;
}
