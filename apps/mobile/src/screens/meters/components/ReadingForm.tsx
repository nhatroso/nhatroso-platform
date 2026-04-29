import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Camera, Image as ImageIcon, X } from '@/assets/icons';

interface ReadingFormProps {
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
            <View className="flex-row gap-4 mb-6">
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

          {/* Input - Removed for OCR-only flow as requested */}
          <View className="mb-6 items-center justify-center py-4 bg-muted/5 rounded-2xl border border-dashed border-muted/30">
            <Text className="text-muted text-sm italic">
              {t(
                'Services.submission.photoRequiredMessage',
                'Hãy chụp ảnh để hệ thống tự động ghi nhận',
              )}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            disabled={isProcessing || !imageUri}
            className="bg-primary p-5 rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {t(
                  'Services.submission.submitPhotoButton',
                  'Nộp ảnh đồng hồ chỉ số',
                )}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
