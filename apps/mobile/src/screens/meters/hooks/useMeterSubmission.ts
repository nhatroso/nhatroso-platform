import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { meterService } from '@/services/meter.service';
import { userService } from '@/services/user.service';
import { MeterResponse } from '@nhatroso/shared';

const MAX_READING_VALUE = 9999999;

export function useMeterSubmission() {
  const { t } = useTranslation();
  const router = useRouter();
  const { period_month } = useLocalSearchParams();
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

  const { data: meters, isLoading: isLoadingMeters } = useQuery<
    MeterResponse[]
  >({
    queryKey: ['my-meters'],
    queryFn: meterService.getMyMeters,
  });

  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['my-room'],
    queryFn: userService.getMyRoom,
  });

  const { data: readingRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['my-reading-requests'],
    queryFn: meterService.getReadingRequests,
  });

  const requiredServices = useMemo(() => {
    if (!room?.services || !readingRequests) return [];
    return room.services.filter((s: any) => {
      const name = s.name?.toLowerCase() || '';
      return name.includes('electricity') || name.includes('water');
    });
  }, [room?.services, readingRequests]);

  const targetRequest = useMemo(() => {
    if (!readingRequests || !room?.id) return null;
    return (readingRequests as any[]).find(
      (req: any) =>
        req.room_id === room.id &&
        (!period_month || req.period_month === period_month),
    );
  }, [readingRequests, room?.id, period_month]);

  useEffect(() => {
    if (requiredServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(requiredServices[0].service_id);
    }
  }, [requiredServices, selectedServiceId]);

  const selectedMeter = (meters || []).find(
    (m) => m.service_id === selectedServiceId,
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
    if (lower.includes('electricity'))
      return t('Services.Predefined_electricity');
    if (lower.includes('water')) return t('Services.Predefined_water');
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

  const isAlreadySubmitted = useMemo(() => {
    if (submittedServices.includes(selectedServiceId || '')) return true;
    const currentPeriod = period_month || targetRequest?.period_month;
    if (selectedMeter && currentPeriod) {
      if (
        selectedMeter.latest_reading_period === currentPeriod &&
        selectedMeter.latest_reading_status != null &&
        selectedMeter.latest_reading_status !== 'PENDING' &&
        selectedMeter.latest_reading_status !== 'FAILED'
      ) {
        return true;
      }
    }
    return false;
  }, [
    selectedServiceId,
    submittedServices,
    selectedMeter,
    period_month,
    targetRequest,
  ]);

  const isServiceSubmitted = useCallback(
    (serviceId: string) => {
      if (submittedServices.includes(serviceId)) return true;
      const sMeter = (meters || []).find((m) => m.service_id === serviceId);
      const currentPeriod = period_month || targetRequest?.period_month;
      if (sMeter && currentPeriod) {
        if (
          sMeter.latest_reading_period === currentPeriod &&
          sMeter.latest_reading_status != null &&
          sMeter.latest_reading_status !== 'PENDING' &&
          sMeter.latest_reading_status !== 'FAILED'
        ) {
          return true;
        }
      }
      return false;
    },
    [submittedServices, meters, period_month, targetRequest],
  );

  const completedServicesCount = requiredServices.filter((s: any) =>
    isServiceSubmitted(s.service_id),
  ).length;

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

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const ocrMutation = useMutation({
    mutationFn: async (data: { meterId: string; uri: string }) => {
      setIsUploading(true);
      try {
        // 1. Get presigned URL
        const { url, key } = await meterService.getUploadUrl();

        // 2. Upload directly to S3
        await meterService.uploadToPresignedUrl(url, data.uri);

        // 3. Submit OCR with the key
        return await meterService.submitOcrReading(data.meterId, {
          image_url: key,
          period_month: period_month as string,
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-meters'] });
      queryClient.invalidateQueries({ queryKey: ['my-reading-requests'] });
      showAlert(
        t('Services.submission.processing'),
        t('Services.submission.ocrProcessingMessage'),
        'success',
      );
      setSubmittedServices((prev) => [...prev, selectedServiceId!]);
      setImageUri(null);
    },
    onError: (error) => {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.ocrErrorMessage'),
      );
      console.error(error);
    },
  });

  const submissionMutation = useMutation({
    mutationFn: (data: {
      meterId: string;
      reading_value: number;
      image_url?: string | null;
      period_month?: string | null;
    }) =>
      meterService.submitReading(data.meterId, {
        reading_value: data.reading_value.toString(),
        reading_date: new Date().toISOString(),
        image_url: data.image_url,
        period_month: data.period_month,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-meters'] });
      queryClient.invalidateQueries({ queryKey: ['my-reading-requests'] });
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

  const handleSubmit = () => {
    if (!selectedServiceId || (!reading.trim() && !imageUri)) {
      showAlert(
        t('Services.submission.errorTitle'),
        t('Services.submission.validationReading'),
      );
      return;
    }
    if (reading.trim()) {
      const val = parseFloat(reading);
      if (
        isNaN(val) ||
        val < 0 ||
        !/^\d+(\.\d{1,2})?$/.test(reading.trim()) ||
        val < previousReading ||
        val > MAX_READING_VALUE
      ) {
        setValidationError(validateReading(reading));
        return;
      }
    }
    setIsSubmitModalVisible(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitModalVisible(false);
    if (!selectedServiceId) return;

    let submitMeterId = (selectedMeter as any)?.id;
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

    if (imageUri && !reading.trim()) {
      // OCR flow
      ocrMutation.mutate({ meterId: submitMeterId, uri: imageUri });
    } else {
      // Regular submission
      const val = parseFloat(reading);
      submissionMutation.mutate({
        meterId: submitMeterId,
        reading_value: val,
        image_url: null,
        period_month: period_month as string,
      });
    }
  };

  const isProcessing =
    submissionMutation.isPending ||
    ocrMutation.isPending ||
    isCreatingMeter ||
    isUploading;

  return {
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
    meters,
    room,
    isLoadingMeters,
    isLoadingRoom,
    isLoadingRequests,
    requiredServices,
    selectedMeter,
    selectedService,
    previousReading,
    completedServicesCount,
    isAlreadySubmitted,
    isProcessing,
    handleReadingChange,
    handleSubmit,
    confirmSubmit,
    pickImage,
    takePhoto,
    getServiceLabel,
    submittedServices,
    isServiceSubmitted,
  };
}
