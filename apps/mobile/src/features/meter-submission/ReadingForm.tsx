import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, X, CheckCircle2 } from '@/src/lib/icons';

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
          <View className="flex-row items-center mb-2">
            <Text className="text-xs text-muted">
              {t('Services.submission.previousReading')}{' '}
            </Text>
            <Text className="text-xs font-bold text-text">
              {previousReading}{' '}
              {String(t(unitKey, selectedService?.unit || ''))}
            </Text>
          </View>

          {/* Inline error */}
          {validationError ? (
            <Text className="text-xs text-error mb-4">{validationError}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Image */}
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
                onPress={onClearImage}
                className="absolute -top-2 -right-2 bg-error h-8 w-8 rounded-full items-center justify-center border-2 border-white shadow-sm"
              >
                <X size={16} className="text-white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-4 mb-6">
              <TouchableOpacity
                onPress={onTakePhoto}
                className="flex-1 flex-row items-center justify-center bg-input p-4 rounded-xl border border-dashed border-border"
              >
                <Camera size={20} className="text-primary mr-2" />
                <Text className="text-primary font-bold">
                  {t('Services.submission.takePhoto')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onPickImage}
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
            onPress={onSubmit}
            disabled={isProcessing || !!validationError}
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
  );
}
