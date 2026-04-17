import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Zap, Droplets, CheckCircle2 } from '@/assets/icons';

interface ServiceSelectorProps {
  requiredServices: any[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
  meters: any[] | undefined;
  submittedServices: string[];
  getServiceLabel: (name?: string | null) => string;
  completedServicesCount: number;
  isServiceSubmitted: (serviceId: string) => boolean;
}

export function ServiceSelector({
  requiredServices,
  selectedServiceId,
  onSelect,
  getServiceLabel,
  completedServicesCount,
  isServiceSubmitted,
}: ServiceSelectorProps) {
  const { t } = useTranslation();

  return (
    <>
      <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4">
        {t('Services.submission.requiredSubmissions')} ({completedServicesCount}
        /{requiredServices.length})
      </Text>
      <View className="flex-row gap-4 mb-8">
        {requiredServices.map((service: any) => {
          const name = service.name?.toLowerCase() || '';
          const isElectricity = name.includes('electricity');
          const isSelected = selectedServiceId === service.service_id;
          const Icon = isElectricity ? Zap : Droplets;

          const isSubmitted = isServiceSubmitted(service.service_id);

          return (
            <TouchableOpacity
              key={service.service_id}
              onPress={() => onSelect(service.service_id)}
              className={`flex-1 p-4 rounded-2xl border border-border items-center justify-center shadow-sm ${isSelected ? 'bg-primary' : 'bg-white'}`}
            >
              <View className="flex-row items-center justify-center relative">
                <View className="h-10 w-10 rounded-full items-center justify-center mb-2 bg-input/20">
                  <Icon
                    size={20}
                    className={
                      isSelected
                        ? 'text-white'
                        : isElectricity
                          ? 'text-warning'
                          : 'text-primary'
                    }
                  />
                </View>
                {isSubmitted && (
                  <View className="absolute -top-1 -right-1 bg-success rounded-full p-0.5 border-2 border-white">
                    <CheckCircle2 size={12} color="white" />
                  </View>
                )}
              </View>
              <Text
                className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-text'}`}
              >
                {getServiceLabel(service.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}
