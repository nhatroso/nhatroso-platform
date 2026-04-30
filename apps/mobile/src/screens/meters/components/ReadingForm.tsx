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
    <View className="bg-white p-5 rounded-2xl border border-border shadow-sm mb-6">
      {!isAlreadySubmitted && (
        <View className="mb-4">
          <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
            {t('Services.submission.newReading', 'Nộp chỉ số mới')}
          </Text>

          {/* Photo Selection Area */}
          {!imageUri ? (
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={onTakePhoto}
                disabled={isProcessing}
                className="flex-1 bg-white border border-border p-5 rounded-2xl items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <View className="h-12 w-12 bg-primary/10 rounded-xl items-center justify-center mb-2">
                  <Camera size={24} className="text-primary" />
                </View>
                <Text className="text-text font-bold text-xs">
                  {t('Services.submission.takePhoto', 'Chụp ảnh')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onPickImage}
                disabled={isProcessing}
                className="flex-1 bg-white border border-border p-5 rounded-2xl items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <View className="h-12 w-12 bg-primary/10 rounded-xl items-center justify-center mb-2">
                  <ImageIcon size={24} className="text-primary" />
                </View>
                <Text className="text-text font-bold text-xs">
                  {t('Services.submission.pickImage', 'Chọn từ máy')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-muted border border-border">
              <Image source={{ uri: imageUri }} className="w-full h-full" />
              <TouchableOpacity
                onPress={onClearImage}
                className="absolute top-4 right-4 bg-black/60 p-2.5 rounded-full"
              >
                <X size={18} color="white" />
              </TouchableOpacity>
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 backdrop-blur-md">
                <Text className="text-white text-xs text-center font-bold">
                  {t(
                    'Services.submission.ocrHint',
                    'Hệ thống sẽ tự động quét chỉ số từ ảnh này',
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* OCR Instruction / Placeholder */}
          {!imageUri && (
            <View className="mt-4 flex-row items-center justify-center p-4 bg-warning/5 rounded-2xl border border-dashed border-warning/30">
              <View className="h-2 w-2 rounded-full bg-warning mr-3" />
              <Text className="text-warning text-xs font-bold italic">
                {t(
                  'Services.submission.photoRequiredMessage',
                  'Vui lòng chụp ảnh đồng hồ rõ nét để tự động ghi nhận',
                )}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={isProcessing || !imageUri}
            className="mt-6 bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-40"
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-base">
                {t('Services.submission.submitPhotoButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isAlreadySubmitted && (
        <View className="items-center py-10 bg-success/5 rounded-3xl border border-success/10">
          <View className="h-20 w-20 bg-success/10 rounded-full items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-success" />
          </View>
          <Text className="text-xl font-black text-text mb-2 text-center">
            {t('Services.submission.alreadySubmitted', 'Đã nộp chỉ số')}
          </Text>
          <Text className="text-muted text-center text-sm px-8 leading-5">
            {t('Services.submission.alreadySubmittedMessage', {
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
            })}
          </Text>
        </View>
      )}
    </View>
  );
}
