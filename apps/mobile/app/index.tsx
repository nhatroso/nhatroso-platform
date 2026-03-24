import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Home, Mail, Lock, ArrowRight } from '@/src/lib/icons';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    // Simulated login that navigates to tabs
    router.replace('/(tabs)/dashboard');
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
            <View>
              <Text className="mb-2 ml-1 text-sm font-semibold text-text">
                Phone or Email
              </Text>
              <View className="flex-row items-center rounded-2xl bg-input border border-border px-4 py-4 focus:border-primary">
                <Mail size={20} className="text-icon" />
                <TextInput
                  placeholder="Enter your phone or email"
                  className="flex-1 ml-3 text-base text-text"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
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
              className="mt-6 flex-row items-center justify-center rounded-2xl bg-primary h-16 shadow-md active:bg-primary-hover active:scale-[0.98] transition-all"
            >
              <Text className="text-xl font-bold text-white mr-2">Login</Text>
              <ArrowRight size={24} color="white" />
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
