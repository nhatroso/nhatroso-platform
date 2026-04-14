import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

export default function RootIndex() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(main)/(tabs)/dashboard" />;
}
