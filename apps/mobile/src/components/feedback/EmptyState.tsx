import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className = '',
}: EmptyStateProps) {
  return (
    <View
      className={`flex-1 items-center justify-center p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 mt-4 ${className}`}
    >
      <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
        <Icon size={32} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 font-bold text-lg mb-2 text-center">
        {title}
      </Text>
      <Text className="text-gray-500 text-sm text-center leading-5">
        {description}
      </Text>
    </View>
  );
}
