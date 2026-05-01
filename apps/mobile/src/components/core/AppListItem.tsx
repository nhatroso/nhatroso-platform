import React from 'react';
import { View, Text } from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import { ChevronRight } from 'lucide-react-native';

interface AppListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress: () => void;
  showChevron?: boolean;
}

export function AppListItem({
  title,
  subtitle,
  icon,
  rightElement,
  onPress,
  showChevron = true,
}: AppListItemProps) {
  return (
    <TouchableRipple
      onPress={onPress}
      className="bg-white rounded-2xl mb-3 overflow-hidden border border-gray-100 shadow-sm"
    >
      <View className="flex-row items-center p-4">
        {icon && <View className="mr-4">{icon}</View>}
        <View className="flex-1 justify-center">
          <Text className="text-base font-bold text-gray-900">{title}</Text>
          {subtitle && (
            <Text className="text-sm font-medium text-gray-500 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
        <View className="flex-row items-center ml-2">
          {rightElement}
          {showChevron && (
            <ChevronRight size={20} color="#9CA3AF" className="ml-2" />
          )}
        </View>
      </View>
    </TouchableRipple>
  );
}
