import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { meterService } from '@/src/api/meter';
import { roomService } from '@/src/api/room';

const MAX_READING_VALUE = 9999999;

export function useMeterSubmission() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [reading, setReading] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingMeter, setIsCreatingMeter] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'error' });
  const [submittedServices, setSubmittedServices] = useState<string[]>([]);

  const { data: meters, isLoading: isLoadingMeters } = useQuery({
    queryKey: ['my-meters'],
    queryFn: meterService.getMyMeters,
  });

  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['my-room'],
    queryFn: roomService.getMyRoom,
  });

  const requiredServices = useMemo(() => {
    return room?.services
      ? room.services.filter((s: any) => {
          const name = s.name?.toLowerCase() || '';
          return (
            name.includes('điện') ||
            name.includes('electricity') ||
            name.includes('nước') ||
            name.includes('water')
          );
        })
      : [];
  }, [room?.services]);

  useEffect(() => {
    if (requiredServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(requiredServices[0].service_id);
    }
  }, [requiredServices, selectedServiceId]);

  const selectedMeter = (meters || []).find(
    (m: any) => m.service_id === selectedServiceId,
  );

  const selectedService = requiredServices.find(
    (s: any) => s.service_id === selectedServiceId,
  );

  const previousReading = useMemo(() => {
    if (!selectedMeter) return 0;
    const raw =
      selectedMeter.latest_reading || selectedMeter.initial_reading || '0';
    return parseFloat(raw) || 0;
  }, [selectedMeter]);

  const getServiceLabel = (name?: string | null): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('điện') || lower.includes('electricity'))
      return t('Services.Predefined_electricity');
    if (lower.includes('nước') || lower.includes('water'))
      return t('Services.Predefined_water');
    return name || '';
  };

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' = 'error',
    onConfirm?: () => void,
  ) => {
    setAlertState({ visible: true, title, message, type, onConfirm });
  };

  const validateReading = (value: string): string | null => {
    if (!value.trim()) return null;
    const val = parseFloat(value);
    if (isNaN(val)) return t('Services.submission.validationNumber');
    if (val < 0) return t('Services.submission.validationNegative');
    if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
      return t('Services.submission.validationDecimalPlaces');
    if (val < previousReading)
      return t('Services.submission.validationLessThanPrevious', {
        newValue: value,
        previousValue: previousReading.toString(),
      });
    if (val > MAX_READING_VALUE)
      return t('Services.submission.validationExceedsMax');
    return null;
  };

  const handleReadingChange = (text: string) => {
    setReading(text);
    setValidationError(text ? validateReading(text) : null);
  };

  const isAlreadySubmitted =
    submittedServices.includes(selectedServiceId || '') ||
    (selectedMeter?.latest_reading_date
      ? new Date(selectedMeter.latest_reading_date).getMonth() ===
          new Date().getMonth() &&
        new Date(selectedMeter.latest_reading_date).getFullYear() ===
          new Date().getFullYear()
      : false);

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
      showAlert(
        t('Services.submission.success'),
        t('Services.submission.successMessage'),
        'success',
      );
      setSubmittedServices((prev) => [...prev, selectedServiceId!]);
      setReading('');
      setImageUri(null);
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
      showAlert(
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
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert(
        t('Services.submission.permissionDenied'),
        t('Services.submission.cameraPermissionRequired'),
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSubmit = () => {
    if (!selectedServiceId || !reading.trim()) {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationReading'),
      );
      return;
    }
    const val = parseFloat(reading);
    if (isNaN(val)) {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationNumber'),
      );
      return;
    }
    if (val < 0) {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationNegative'),
      );
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(reading.trim())) {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationDecimalPlaces'),
      );
      return;
    }
    if (val < previousReading) {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationLessThanPrevious', {
          newValue: reading,
          previousValue: previousReading.toString(),
        }),
      );
      return;
    }
    if (val > MAX_READING_VALUE) {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationExceedsMax'),
      );
      return;
    }
    setIsSubmitModalVisible(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitModalVisible(false);
    if (!selectedServiceId) return;

    const val = parseFloat(reading);
    let finalImageUrl = null;
    if (imageUri) {
      try {
        setIsUploading(true);
        finalImageUrl = await meterService.uploadImage(imageUri);
      } catch {
        showAlert(
          t('Services.submission.uploadFailed'),
          t('Services.submission.uploadFailedMessage'),
        );
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

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
        showAlert(
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

  const isProcessing =
    submissionMutation.isPending || isUploading || isCreatingMeter;

  return {
    // state
    selectedServiceId,
    setSelectedServiceId,
    reading,
    validationError,
    imageUri,
    setImageUri,
    isSubmitModalVisible,
    setIsSubmitModalVisible,
    alertState,
    setAlertState,
    submittedServices,
    // data
    meters,
    room,
    isLoadingMeters,
    isLoadingRoom,
    requiredServices,
    selectedMeter,
    selectedService,
    previousReading,
    completedServicesCount,
    isAlreadySubmitted,
    isProcessing,
    // handlers
    handleReadingChange,
    handleSubmit,
    confirmSubmit,
    pickImage,
    takePhoto,
    getServiceLabel,
  };
}
