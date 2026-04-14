import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CheckCircle2 } from '@/src/lib/icons';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { useMeterSubmission } from '@/src/hooks/useMeterSubmission';
import { ServiceSelector } from '@/src/features/meter-submission/ServiceSelector';
import { ReadingForm } from '@/src/features/meter-submission/ReadingForm';
import { MeterInfoCard } from '@/src/features/meter-submission/MeterInfoCard';

export default function MeterSubmissionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
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
    isLoadingMeters,
    isLoadingRoom,
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
  } = useMeterSubmission();

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
        <Text
          onPress={() => router.back()}
          className="mt-8 bg-primary px-8 py-3 rounded-2xl text-white font-bold text-lg"
        >
          {t('Services.submission.back')}
        </Text>
      </View>
    );
  }

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
        <View className="mb-8 mt-2">
          <Text className="text-3xl font-extrabold text-text tracking-tight">
            {t('Dashboard.tenant.reportMeterReading') || 'Nộp chỉ số'}
          </Text>
        </View>

        <ServiceSelector
          requiredServices={requiredServices}
          selectedServiceId={selectedServiceId}
          onSelect={setSelectedServiceId}
          meters={meters}
          submittedServices={submittedServices}
          getServiceLabel={getServiceLabel}
          completedServicesCount={completedServicesCount}
          isServiceSubmitted={isServiceSubmitted}
        />

        <ReadingForm
          reading={reading}
          validationError={validationError}
          onReadingChange={handleReadingChange}
          imageUri={imageUri}
          onClearImage={() => setImageUri(null)}
          onTakePhoto={takePhoto}
          onPickImage={pickImage}
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          isAlreadySubmitted={isAlreadySubmitted}
          previousReading={previousReading}
          selectedService={selectedService}
        />

        <MeterInfoCard
          selectedMeter={selectedMeter}
          selectedService={selectedService}
          isAlreadySubmitted={isAlreadySubmitted}
        />
      </View>

      {/* Confirm submit modal */}
      <ConfirmModal
        visible={isSubmitModalVisible}
        onClose={() => setIsSubmitModalVisible(false)}
        onConfirm={confirmSubmit}
        title={t('Services.submission.confirmTitle', 'Xác nhận nộp chỉ số')}
        description={t(
          'Services.submission.confirmMessage',
          `Bạn có chắc chắn muốn nộp chỉ số ${reading} ${t(
            `Services.Unit_${selectedService?.unit || ''}`,
            selectedService?.unit || '',
          )} không?`,
        )}
        confirmText={t('Services.submission.submit', 'Nộp')}
        cancelText={t('Services.submission.cancel', 'Hủy')}
        isDestructive={false}
      />

      {/* Alert modal */}
      <ConfirmModal
        visible={alertState.visible}
        onClose={() => {
          setAlertState((prev) => ({ ...prev, visible: false }));
          if (alertState.onConfirm) alertState.onConfirm();
        }}
        title={alertState.title}
        description={alertState.message}
        confirmText={t('Services.submission.ok', 'OK')}
        hideCancel
        isDestructive={alertState.type === 'error'}
      />
    </ScrollView>
  );
}
