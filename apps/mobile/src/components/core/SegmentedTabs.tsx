import React from 'react';
import { View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

interface TabItem {
  key: string;
  title: string;
}

interface SegmentedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function SegmentedTabs({
  tabs,
  activeTab,
  onTabChange,
}: SegmentedTabsProps) {
  return (
    <View className="mb-5">
      <SegmentedButtons
        value={activeTab}
        onValueChange={onTabChange}
        buttons={tabs.map((tab) => ({
          value: tab.key,
          label: tab.title,
        }))}
        theme={{
          colors: {
            secondaryContainer: '#DBEAFE', // blue-100 for active tab background
            onSecondaryContainer: '#2563EB', // blue-600 for active tab text
            outline: '#E5E7EB', // gray-200 for border
          },
        }}
      />
    </View>
  );
}
