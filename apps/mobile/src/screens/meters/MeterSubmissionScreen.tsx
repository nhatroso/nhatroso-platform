import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CheckCircle2 } from '@/assets/icons';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useMeterSubmission } from './hooks/useMeterSubmission';
import { ServiceSelector } from './components/ServiceSelector';
import { ReadingForm } from './components/ReadingForm';
import { MeterInfoCard } from './components/MeterInfoCard';

export function MeterSubmissionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    selectedServiceId,
    setSelectedServiceId,
    imageUri,
    setImageUri,
    isSubmitModalVisible,
    setIsSubmitModalVisible,
    alertState,
    setAlertState,
    isLoadingMeters,
    isLoadingRoom,
    requiredServices,
    selectedMeter,
    selectedService,
    previousReading,
    completedServicesCount,
    isAlreadySubmitted,
    isProcessing,
    handleSubmit,
    confirmSubmit,
    pickImage,
    takePhoto,
    getServiceLabel,
    submittedServices,
    currentPeriod,
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
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: t('Services.submission.title', 'Nộp chỉ số điện nước'),
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="p-6">
          {/* Header Summary */}
          <View className="bg-white p-5 rounded-3xl border border-border shadow-sm mb-6 flex-row items-center overflow-hidden">
            <View className="flex-1">
              <Text className="text-muted text-[10px] font-black uppercase tracking-[1px] mb-1">
                {t('Services.submission.progress', 'Tiến độ hoàn thành')}
              </Text>
              <Text className="text-2xl font-black text-text">
                {completedServicesCount}/{requiredServices.length}{' '}
                <Text className="text-sm font-bold text-muted">
                  {t('Services.submission.services', 'Dịch vụ')}
                </Text>
              </Text>
            </View>
          </View>

          {/* Service Selector */}
          <ServiceSelector
            services={requiredServices}
            selectedId={selectedServiceId}
            onSelect={setSelectedServiceId}
            getLabel={getServiceLabel}
            submittedServices={submittedServices}
          />

          {/* Meter Info Card */}
          <MeterInfoCard
            meter={selectedMeter}
            previousReading={previousReading}
            selectedService={selectedService}
            currentPeriod={currentPeriod}
          />

          {/* Reading Form */}
          <ReadingForm
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
        </View>
      </ScrollView>

      <ConfirmModal
        visible={isSubmitModalVisible}
        onClose={() => setIsSubmitModalVisible(false)}
        onConfirm={confirmSubmit}
        title={t('Services.submission.confirmTitle')}
        description={t('Services.submission.confirmMessage')}
        confirmText={t('Services.submission.submit')}
        cancelText={t('Services.submission.cancel')}
        isDestructive={false}
      />

      <ConfirmModal
        visible={alertState.visible}
        onClose={() => {
          setAlertState((prev: any) => ({ ...prev, visible: false }));
          if (alertState.onConfirm) alertState.onConfirm();
        }}
        title={alertState.title}
        description={alertState.message}
        confirmText={t('Services.submission.ok', 'OK')}
        hideCancel
        isDestructive={alertState.type === 'error'}
      />
    </View>
  );
}
