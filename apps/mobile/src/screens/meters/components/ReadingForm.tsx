import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Camera, Image as ImageIcon, X } from '@/assets/icons';

interface ReadingFormProps {
  reading: string;
  validationError: string | null;
  onReadingChange: (text: string) => void;
  imageUri: string | null;
  onClearImage: () => void;
  onTakePhoto: () => void;
  onPickImage: () => void;
  onSubmit: () => void;
  isProcessing: boolean;
  isAlreadySubmitted: boolean;
  previousReading: number;
  selectedService: any;
}

export function ReadingForm({
  reading,
  validationError,
  onReadingChange,
  imageUri,
  onClearImage,
  onTakePhoto,
  onPickImage,
  onSubmit,
  isProcessing,
  isAlreadySubmitted,
  previousReading,
  selectedService,
}: ReadingFormProps) {
  const { t } = useTranslation();

  const unitKey = `Services.Unit_${selectedService?.unit || ''}`;
  const unitFallback = selectedService?.unit || 'kWh/m³';

  return (
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
          {/* Photo Section */}
          {!imageUri ? (
            <View className="flex-row space-x-3 mb-6">
              <TouchableOpacity
                onPress={onTakePhoto}
                disabled={isProcessing}
                className="flex-1 bg-primary/5 border border-primary/20 p-4 rounded-2xl items-center justify-center"
              >
                <Camera size={24} className="text-primary mb-1" />
                <Text className="text-primary font-bold text-xs">
                  {t('Services.submission.takePhoto')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onPickImage}
                disabled={isProcessing}
                className="flex-1 bg-muted/5 border border-muted/20 p-4 rounded-2xl items-center justify-center"
              >
                <ImageIcon size={24} className="text-muted mb-1" />
                <Text className="text-muted font-bold text-xs">
                  {t('Services.submission.pickImage')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="relative mb-6 rounded-2xl overflow-hidden aspect-[4/3] bg-muted/10">
              <Image source={{ uri: imageUri }} className="w-full h-full" />
              <TouchableOpacity
                onPress={onClearImage}
                className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
              >
                <X size={16} color="white" />
              </TouchableOpacity>
              <View className="absolute bottom-0 left-0 right-0 bg-black/30 p-2">
                <Text className="text-white text-[10px] text-center font-bold">
                  {t('Services.submission.ocrHint')}
                </Text>
              </View>
            </View>
          )}

          {/* Input */}
          <View
            className={`flex-row items-end border-b-2 ${validationError ? 'border-error' : 'border-primary/20'} pb-2 mb-2`}
          >
            <TextInput
              value={reading}
              onChangeText={onReadingChange}
              placeholder="0.00"
              keyboardType="numeric"
              className="flex-1 text-4xl font-extrabold text-text mt-2"
            />
            <Text className="text-xl font-bold text-muted ml-2 pb-2">
              {String(t(unitKey, unitFallback))}
            </Text>
          </View>

          {/* Previous reading hint */}
          <View className="flex-row items-center mb-4">
            <Text className="text-xs text-muted">
              {t('Services.submission.previousReading')}{' '}
            </Text>
            <Text className="text-xs font-bold text-text">
              {previousReading}{' '}
              {String(t(unitKey, selectedService?.unit || ''))}
            </Text>
          </View>

          {/* Inline error */}
          {validationError && (
            <Text className="text-xs text-error mb-4">{validationError}</Text>
          )}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={isProcessing || (!!validationError && !imageUri)}
            className="bg-primary p-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {imageUri && !reading
                  ? t('Services.submission.submitWithOcr')
                  : t('Services.submission.submitReadingButton')}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
