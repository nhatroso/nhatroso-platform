import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Zap, Droplets, CheckCircle2 } from '@/assets/icons';

interface ServiceSelectorProps {
  services: any[];
  selectedId: string | null;
  onSelect: (serviceId: string) => void;
  getLabel: (name?: string | null) => string;
  submittedServices: string[];
}

export function ServiceSelector({
  services,
  selectedId,
  onSelect,
  getLabel,
  submittedServices,
}: ServiceSelectorProps) {
  const { t } = useTranslation();

  return (
    <>
      <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4">
        {t('Services.submission.requiredSubmissions', 'Các chỉ số cần nộp')}
      </Text>
      <View className="flex-row gap-4 mb-6">
        {services.map((service: any) => {
          const name = service.name?.toLowerCase() || '';
          const isElectricity = name.includes('electricity');
          const isSelected = selectedId === service.service_id;
          const Icon = isElectricity ? Zap : Droplets;
          const isSubmitted = submittedServices.includes(service.service_id);

          return (
            <TouchableOpacity
              key={service.service_id}
              onPress={() => onSelect(service.service_id)}
              className={`flex-1 p-4 rounded-2xl border items-center justify-center shadow-sm active:scale-95 transition-transform ${
                isSelected
                  ? 'bg-primary border-primary shadow-primary/20'
                  : 'bg-white border-border shadow-black/5'
              }`}
            >
              <View className="h-11 w-11 rounded-xl items-center justify-center mb-2 bg-gray-50/50">
                <Icon
                  size={22}
                  className={
                    isSelected
                      ? 'text-white'
                      : isElectricity
                        ? 'text-warning'
                        : 'text-primary'
                  }
                  color={isSelected ? 'white' : undefined}
                />
                {isSubmitted && (
                  <View className="absolute -top-1 -right-1 rounded-full p-1 border-2 border-white bg-success">
                    <CheckCircle2 size={12} color="white" />
                  </View>
                )}
              </View>
              <Text
                className={`font-black text-sm ${isSelected ? 'text-white' : 'text-text'}`}
              >
                {getLabel(service.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}
