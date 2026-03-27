import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Home, Mail, Lock, ArrowRight, AlertCircle } from '@/src/lib/icons';
import { useAuth } from '@/src/context/AuthContext';
import { authService } from '@/src/api/auth';
import { LoginSchema } from '@nhatroso/shared';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Client-side validation
      const validation = LoginSchema.safeParse({ phone: identifier, password });
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        setIsSubmitting(false);
        return;
      }

      // 2. Call backend service
      const response = await authService.login(validation.data);

      // 3. Update Auth Context
      await login(response);

      // 4. Navigate to dashboard (navigation guard in layout will handle redirects)
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Login failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center py-12">
          {/* Logo Section */}
          <View className="mb-12 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-primary">
              <Home size={40} color="white" />
            </View>
            <Text className="text-4xl font-extrabold text-text tracking-tight">
              Sign in
            </Text>
            <Text className="mt-2 text-lg font-medium text-muted">
              to the Nhatroso Platform
            </Text>
          </View>

          {/* Form Section */}
          <View className="gap-y-6">
            {error && (
              <View className="flex-row items-center rounded-xl bg-destructive/10 p-4 border border-destructive/20">
                <AlertCircle size={20} className="text-destructive mr-2" />
                <Text className="flex-1 text-sm font-medium text-destructive">
                  {error}
                </Text>
              </View>
            )}

            <View>
              <Text className="mb-2 ml-1 text-sm font-semibold text-text">
                Phone Number
              </Text>
              <View className="flex-row items-center rounded-2xl bg-input border border-border px-4 py-4 focus:border-primary">
                <Mail size={20} className="text-icon" />
                <TextInput
                  placeholder="Enter your phone number"
                  className="flex-1 ml-3 text-base text-text"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 ml-1 text-sm font-semibold text-text">
                Password
              </Text>
              <View className="flex-row items-center rounded-2xl bg-input border border-border px-4 py-4 focus:border-primary">
                <Lock size={20} className="text-icon" />
                <TextInput
                  placeholder="Enter your password"
                  className="flex-1 ml-3 text-base text-text"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <TouchableOpacity className="mt-4 self-end">
                <Text className="text-sm font-semibold text-primary">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isSubmitting}
              className={`mt-6 flex-row items-center justify-center rounded-2xl h-16 shadow-md transition-all ${
                isSubmitting
                  ? 'bg-primary/70'
                  : 'bg-primary active:bg-primary-hover active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-xl font-bold text-white mr-2">
                    Login
                  </Text>
                  <ArrowRight size={24} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text className="mt-auto pt-8 text-center text-xs font-semibold text-muted opacity-50">
            © 2026 NHATROSO PLATFORM
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
