import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Droplets,
  Camera,
  ChevronLeft,
  CheckCircle2,
} from '@/src/lib/icons';
import { meterService } from '@/src/api/meter';

export default function MeterSubmissionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [reading, setReading] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: meters, isLoading: isLoadingMeters } = useQuery({
    queryKey: ['my-meters'],
    queryFn: meterService.getMyMeters,
  });

  useEffect(() => {
    if (meters && meters.length > 0 && !selectedMeterId) {
      setSelectedMeterId(meters[0].id);
    }
  }, [meters, selectedMeterId]);

  const submissionMutation = useMutation({
    mutationFn: (data: { meterId: string; reading_value: number }) =>
      meterService.submitReading(data.meterId, {
        reading_value: data.reading_value.toString(),
        reading_date: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-meters'] });
      setIsSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to submit reading. Please try again.');
      console.error(error);
    },
  });

  const handleSubmit = () => {
    if (!selectedMeterId || !reading) {
      Alert.alert('Validation', 'Please enter a reading value.');
      return;
    }

    const val = parseFloat(reading);
    if (isNaN(val)) {
      Alert.alert('Validation', 'Please enter a valid number.');
      return;
    }

    submissionMutation.mutate({
      meterId: selectedMeterId,
      reading_value: val,
    });
  };

  const selectedMeter = meters?.find((m) => m.id === selectedMeterId);

  if (isLoadingMeters) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (isSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <View className="h-20 w-20 bg-success/10 rounded-full items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-success" />
        </View>
        <Text className="text-2xl font-bold text-text text-center">
          Reading Submitted!
        </Text>
        <Text className="text-muted text-center mt-2">
          Your meter reading has been recorded successfully.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-12 pb-6 flex-row items-center border-b border-border bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-input mr-4"
        >
          <ChevronLeft size={24} className="text-text" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text">
          Report Meter Reading
        </Text>
      </View>

      <View className="p-6">
        {/* Meter Selector */}
        <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4">
          Select Meter
        </Text>
        <View className="flex-row gap-4 mb-8">
          {Array.isArray(meters) &&
            meters.map((meter) => {
              const isElectricity =
                meter.service_id.includes('elec') ||
                meter.serial_number?.toLowerCase().includes('e');
              const Icon = isElectricity ? Zap : Droplets;
              const bgClass =
                selectedMeterId === meter.id ? 'bg-primary' : 'bg-white';
              const textClass =
                selectedMeterId === meter.id ? 'text-white' : 'text-text';
              const iconClass =
                selectedMeterId === meter.id
                  ? 'text-white'
                  : isElectricity
                    ? 'text-warning'
                    : 'text-primary';

              return (
                <TouchableOpacity
                  key={meter.id}
                  onPress={() => setSelectedMeterId(meter.id)}
                  className={`flex-1 p-4 rounded-2xl border border-border items-center justify-center shadow-sm ${bgClass}`}
                >
                  <View
                    className={`h-10 w-10 rounded-full items-center justify-center mb-2 bg-input/20`}
                  >
                    <Icon size={20} className={iconClass} />
                  </View>
                  <Text className={`font-bold text-sm ${textClass}`}>
                    {isElectricity ? 'Electricity' : 'Water'}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Input Form */}
        <View className="bg-white p-6 rounded-3xl border border-border shadow-sm mb-8">
          <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
            New Reading Value
          </Text>
          <View className="flex-row items-end border-b-2 border-primary/20 pb-2 mb-6">
            <TextInput
              value={reading}
              onChangeText={setReading}
              placeholder="0.00"
              keyboardType="numeric"
              className="flex-1 text-4xl font-extrabold text-text mt-2"
            />
            <Text className="text-xl font-bold text-muted ml-2 pb-2">
              kWh/m³
            </Text>
          </View>

          <TouchableOpacity className="flex-row items-center justify-center bg-input p-4 rounded-xl border border-dashed border-border mb-4">
            <Camera size={24} className="text-muted mr-3" />
            <Text className="text-muted font-bold">
              Add Photo Evidence (Optional)
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-muted mb-6 italic">
            * Please ensure the meter value is clearly visible in the photo.
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submissionMutation.isPending}
            className="bg-primary p-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50"
          >
            {submissionMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Submit Reading
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex-row">
          <View className="h-8 w-8 bg-primary/20 rounded-full items-center justify-center mr-4">
            <Zap size={16} className="text-primary" />
          </View>
          <View className="flex-1">
            <Text className="text-primary font-bold text-sm">
              Last Recorded
            </Text>
            <Text className="text-text font-medium text-xs mt-1">
              Your last electricity reading was{' '}
              {selectedMeter?.initial_reading || '0'} kWh on Mar 01.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
