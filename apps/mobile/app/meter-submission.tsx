import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Zap, Droplets, Camera, CheckCircle2, X } from '@/src/lib/icons';
import { meterService } from '@/src/api/meter';
import { roomService } from '@/src/api/room';
import { useTranslation } from 'react-i18next';

export default function MeterSubmissionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [reading, setReading] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingMeter, setIsCreatingMeter] = useState(false);
  const [submittedServices, setSubmittedServices] = useState<string[]>([]);

  const { data: meters, isLoading: isLoadingMeters } = useQuery({
    queryKey: ['my-meters'],
    queryFn: meterService.getMyMeters,
  });

  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['my-room'],
    queryFn: roomService.getMyRoom,
  });

  // Determine required submissions solely by the services attached to the room
  const requiredServices = useMemo(() => {
    return room?.services
      ? room.services.filter((s: any) => {
          const name = s.name?.toLowerCase() || '';
          const isElec =
            name.includes('điện') ||
            name.includes('elec') ||
            name.includes('electricity');
          const isWater = name.includes('nước') || name.includes('water');
          return isElec || isWater;
        })
      : [];
  }, [room?.services]);

  useEffect(() => {
    if (requiredServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(requiredServices[0].service_id);
    }
  }, [requiredServices, selectedServiceId]);

  const submissionMutation = useMutation({
    mutationFn: (data: {
      meterId: string;
      reading_value: number;
      image_url?: string | null;
    }) =>
      meterService.submitReading(data.meterId, {
        reading_value: data.reading_value.toString(),
        reading_date: new Date().toISOString(),
        image_url: data.image_url,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-meters'] });
      Alert.alert(
        t('Services.submission.success'),
        t('Services.submission.successMessage'),
      );
      setSubmittedServices((prev) => [...prev, selectedServiceId!]);
      setReading('');
      setImageUri(null);

      // Check if there are remaining pending services
      const nextService = requiredServices.find(
        (s: any) =>
          s.service_id !== selectedServiceId &&
          !submittedServices.includes(s.service_id),
      );

      if (nextService) {
        setSelectedServiceId(nextService.service_id);
      } else {
        router.back();
      }
    },
    onError: (error) => {
      Alert.alert(
        t('Services.submission.errorTitle'),
        t('Services.submission.errorMessage'),
      );
      console.error(error);
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('Services.submission.permissionDenied'),
        t('Services.submission.cameraPermissionRequired'),
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const selectedMeter = (meters || []).find(
    (m: any) => m.service_id === selectedServiceId,
  );

  const selectedService = requiredServices.find(
    (s: any) => s.service_id === selectedServiceId,
  );

  const isAlreadySubmitted =
    submittedServices.includes(selectedServiceId || '') ||
    (selectedMeter?.latest_reading_date
      ? new Date(selectedMeter.latest_reading_date).getMonth() ===
          new Date().getMonth() &&
        new Date(selectedMeter.latest_reading_date).getFullYear() ===
          new Date().getFullYear()
      : false);

  const handleSubmit = async () => {
    if (!selectedServiceId || !reading) {
      Alert.alert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationReading'),
      );
      return;
    }

    const val = parseFloat(reading);
    if (isNaN(val)) {
      Alert.alert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationNumber'),
      );
      return;
    }

    let finalImageUrl = null;
    if (imageUri) {
      try {
        setIsUploading(true);
        finalImageUrl = await meterService.uploadImage(imageUri);
      } catch {
        Alert.alert(
          t('Services.submission.uploadFailed'),
          t('Services.submission.uploadFailedMessage'),
        );
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Auto-create meter if it doesn't exist yet
    let submitMeterId = selectedMeter?.id;
    if (!submitMeterId) {
      if (!room?.id) return;
      try {
        setIsCreatingMeter(true);
        const newMeter = await meterService.createMeter({
          room_id: room.id,
          service_id: selectedServiceId,
        });
        submitMeterId = newMeter.id;
      } catch {
        setIsCreatingMeter(false);
        Alert.alert(
          t('Services.submission.errorTitle'),
          t('Services.submission.createMeterError'),
        );
        return;
      } finally {
        setIsCreatingMeter(false);
      }
    }

    submissionMutation.mutate({
      meterId: submitMeterId,
      reading_value: val,
      image_url: finalImageUrl,
    });
  };

  if (isLoadingMeters || isLoadingRoom) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (requiredServices.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <View className="h-20 w-20 bg-primary/10 rounded-full items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-primary" />
        </View>
        <Text className="text-2xl font-bold text-text text-center">
          {t('Services.submission.noRequiredRequests')}
        </Text>
        <Text className="text-muted text-center mt-2">
          {t('Services.submission.noRequiredRequestsMessage')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 bg-primary px-8 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold text-lg">
            {t('Services.submission.back')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isProcessing =
    submissionMutation.isPending || isUploading || isCreatingMeter;

  // Calculate globally completed services to show total progress
  const completedServicesCount = requiredServices.filter((s: any) => {
    const isSessionSubmitted = submittedServices.includes(s.service_id);
    const sMeter = (meters || []).find(
      (m: any) => m.service_id === s.service_id,
    );
    const isHistoricalSubmitted = sMeter?.latest_reading_date
      ? new Date(sMeter.latest_reading_date).getMonth() ===
          new Date().getMonth() &&
        new Date(sMeter.latest_reading_date).getFullYear() ===
          new Date().getFullYear()
      : false;
    return isSessionSubmitted || isHistoricalSubmitted;
  }).length;

  return (
    <ScrollView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: t('Dashboard.tenant.reportMeterReading') || 'Nộp chỉ số',
          headerBackTitle: '',
          headerShadowVisible: false,
        }}
      />
      <View className="p-6">
        {/* Page Title to match Tabs */}
        <View className="mb-8 mt-2">
          <Text className="text-3xl font-extrabold text-text tracking-tight">
            {t('Dashboard.tenant.reportMeterReading') || 'Nộp chỉ số'}
          </Text>
        </View>

        {/* Service Selector */}
        <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4">
          {t('Services.submission.requiredSubmissions')} (
          {completedServicesCount}/{requiredServices.length})
        </Text>
        <View className="flex-row gap-4 mb-8">
          {requiredServices.map((service: any) => {
            const name = service.name?.toLowerCase() || '';
            const isElectricity =
              name.includes('điện') || name.includes('elec');
            const bgClass =
              selectedServiceId === service.service_id
                ? 'bg-primary'
                : 'bg-white';
            const textClass =
              selectedServiceId === service.service_id
                ? 'text-white'
                : 'text-text';
            const Icon = isElectricity ? Zap : Droplets;
            const iconClass =
              selectedServiceId === service.service_id
                ? 'text-white'
                : isElectricity
                  ? 'text-warning'
                  : 'text-primary';

            const currentMeter = (meters || []).find(
              (m: any) => m.service_id === service.service_id,
            );
            const latestDateStr = currentMeter?.latest_reading_date;

            const isThisServiceSubmitted =
              submittedServices.includes(service.service_id) ||
              (latestDateStr
                ? new Date(latestDateStr).getMonth() ===
                    new Date().getMonth() &&
                  new Date(latestDateStr).getFullYear() ===
                    new Date().getFullYear()
                : false);

            return (
              <TouchableOpacity
                key={service.service_id}
                onPress={() => setSelectedServiceId(service.service_id)}
                className={`flex-1 p-4 rounded-2xl border border-border items-center justify-center shadow-sm ${bgClass}`}
              >
                <View className="flex-row items-center justify-center relative">
                  <View
                    className={`h-10 w-10 rounded-full items-center justify-center mb-2 bg-input/20`}
                  >
                    <Icon size={20} className={iconClass} />
                  </View>
                  {isThisServiceSubmitted && (
                    <View className="absolute -top-1 -right-1 bg-success rounded-full p-0.5 border-2 border-white">
                      <CheckCircle2 size={12} color="white" />
                    </View>
                  )}
                </View>
                <Text className={`font-bold text-sm ${textClass}`}>
                  {service.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input Form */}
        <View className="bg-white p-6 rounded-3xl border border-border shadow-sm mb-8">
          <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
            {t('Services.submission.newReading')}
          </Text>

          {isAlreadySubmitted ? (
            <View className="items-center py-6">
              <View className="h-16 w-16 bg-success/10 rounded-full items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-success" />
              </View>
              <Text className="text-lg font-bold text-text mb-1 text-center">
                {t('Services.submission.alreadySubmitted')}
              </Text>
              <Text className="text-muted text-center text-sm">
                {t('Services.submission.alreadySubmittedMessage', {
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                })}
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-end border-b-2 border-primary/20 pb-2 mb-6">
                <TextInput
                  value={reading}
                  onChangeText={setReading}
                  placeholder="0.00"
                  keyboardType="numeric"
                  className="flex-1 text-4xl font-extrabold text-text mt-2"
                />
                <Text className="text-xl font-bold text-muted ml-2 pb-2">
                  {selectedService?.unit || 'kWh/m³'}
                </Text>
              </View>

              {imageUri ? (
                <View className="mb-6 relative">
                  <View className="w-full h-48 rounded-2xl overflow-hidden border border-border">
                    <Image
                      source={{ uri: imageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setImageUri(null)}
                    className="absolute -top-2 -right-2 bg-error h-8 w-8 rounded-full items-center justify-center border-2 border-white shadow-sm"
                  >
                    <X size={16} className="text-white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row gap-4 mb-6">
                  <TouchableOpacity
                    onPress={takePhoto}
                    className="flex-1 flex-row items-center justify-center bg-input p-4 rounded-xl border border-dashed border-border"
                  >
                    <Camera size={20} className="text-primary mr-2" />
                    <Text className="text-primary font-bold">
                      {t('Services.submission.takePhoto')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickImage}
                    className="flex-1 flex-row items-center justify-center bg-input p-4 rounded-xl border border-dashed border-border"
                  >
                    <Text className="text-primary font-bold">
                      {t('Services.submission.pickImage')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text className="text-xs text-muted mb-6 italic">
                {t('Services.submission.photoGuideline')}
              </Text>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isProcessing}
                className="bg-primary p-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    {t('Services.submission.submitReadingButton')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Info Card - always visible to show status and previous records */}
        <View className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex-row">
          <View className="h-8 w-8 bg-primary/20 rounded-full items-center justify-center mr-4">
            <Zap size={16} className="text-primary" />
          </View>
          <View className="flex-1">
            <Text className="text-primary font-bold text-sm">
              {t('Services.submission.meterInfo', {
                serviceName: selectedService?.name?.toLowerCase() || '',
              })}
            </Text>

            <View className="mt-2 space-y-1">
              <View className="flex-row items-center">
                <Text className="text-muted text-xs w-24">
                  {t('Services.submission.status')}
                </Text>
                <View className="flex-row items-center">
                  <View
                    className={`h-2 w-2 rounded-full mr-1.5 ${isAlreadySubmitted ? 'bg-success' : 'bg-warning'}`}
                  />
                  <Text className="text-text font-medium text-xs">
                    {isAlreadySubmitted
                      ? t('Services.submission.submitted')
                      : t('Services.submission.notSubmitted')}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-1">
                <Text className="text-muted text-xs w-24">
                  {t('Services.submission.lastRecorded')}
                </Text>
                <Text className="text-text font-bold text-xs">
                  {selectedMeter
                    ? selectedMeter.latest_reading ||
                      selectedMeter.initial_reading
                    : '0'}{' '}
                  {selectedService?.unit || ''}
                </Text>
              </View>

              {selectedMeter?.serial_number && (
                <View className="flex-row items-center mt-1">
                  <Text className="text-muted text-xs w-24">
                    {t('Services.submission.serialNumber')}
                  </Text>
                  <Text className="text-text font-medium text-xs uppercase">
                    {selectedMeter.serial_number}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
