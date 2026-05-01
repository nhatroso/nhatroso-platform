import React from 'react';
import { View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function AppCard({ children, onPress, className = '' }: AppCardProps) {
  if (onPress) {
    return (
      <TouchableRipple
        onPress={onPress}
        className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${className}`}
      >
        <View className="p-4">{children}</View>
      </TouchableRipple>
    );
  }

  return (
    <View
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${className}`}
    >
      {children}
    </View>
  );
}
