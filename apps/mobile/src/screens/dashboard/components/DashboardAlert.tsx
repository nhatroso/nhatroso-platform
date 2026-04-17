import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { ChevronRight } from '@/assets/icons';
import { LucideIcon } from 'lucide-react-native';

interface DashboardAlertProps {
  onPress: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  type: 'primary' | 'error' | 'warning';
}

export function DashboardAlert({
  onPress,
  icon: Icon,
  title,
  description,
  type,
}: DashboardAlertProps) {
  const colors = {
    primary: {
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      iconBg: 'bg-primary/20',
      text: 'text-primary',
      subtext: 'text-primary/70',
      chevron: 'text-primary/50',
    },
    error: {
      bg: 'bg-error/10',
      border: 'border-error/20',
      iconBg: 'bg-error/20',
      text: 'text-error',
      subtext: 'text-error/70',
      chevron: 'text-error/50',
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      iconBg: 'bg-warning/20',
      text: 'text-warning',
      subtext: 'text-warning/70',
      chevron: 'text-warning/50',
    },
  };

  const style = colors[type];

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mb-6 ${style.bg} border ${style.border} p-5 rounded-3xl flex-row items-center min-h-[96px]`}
    >
      <View
        className={`h-12 w-12 ${style.iconBg} rounded-2xl items-center justify-center mr-4`}
      >
        <Icon size={28} className={style.text} />
      </View>
      <View className="flex-1">
        <Text className={`${style.text} font-bold text-lg`} numberOfLines={1}>
          {title}
        </Text>
        <Text className={`${style.subtext} font-medium`} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <ChevronRight size={20} className={style.chevron} />
    </TouchableOpacity>
  );
}
