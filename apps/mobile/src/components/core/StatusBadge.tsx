import React from 'react';
import { View, Text } from 'react-native';

export type StatusType = 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
}

const statusConfig = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorClass = statusConfig[status] || statusConfig.info;
  const [bgClass, textClass] = colorClass.split(' ');

  return (
    <View className={`px-2 py-0.5 rounded-md flex-row items-center ${bgClass}`}>
      <Text
        className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}
      >
        {label}
      </Text>
    </View>
  );
}
