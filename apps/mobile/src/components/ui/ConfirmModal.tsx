import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { AlertCircle, X } from '@/src/lib/icons';

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  icon?: any;
  customActions?: React.ReactNode;
  hideCancel?: boolean;
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Yes, I'm sure",
  cancelText = 'No, cancel',
  isDestructive = true,
  icon: IconProp,
  customActions,
  hideCancel = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-xl w-full max-w-sm p-6 items-center shadow-lg relative">
              {/* Close Button top right */}
              <TouchableOpacity
                onPress={onClose}
                className="absolute top-2 right-2 p-2 rounded-lg"
              >
                <X size={24} className="text-gray-400" />
              </TouchableOpacity>

              {/* Icon */}
              <View className="mt-2 mb-4">
                {IconProp ? (
                  <IconProp size={56} className="text-gray-400" />
                ) : (
                  <AlertCircle size={56} className="text-gray-400" />
                )}
              </View>

              {/* Text */}
              {title && (
                <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                  {title}
                </Text>
              )}
              {description && (
                <Text className="text-lg font-normal text-gray-500 text-center mb-6">
                  {description}
                </Text>
              )}

              {/* Actions */}
              {customActions ? (
                customActions
              ) : (
                <View className="flex-row items-center justify-center gap-3 w-full">
                  {!hideCancel && (
                    <TouchableOpacity
                      onPress={onClose}
                      className="py-3 px-5 rounded-lg border border-gray-200 bg-white items-center justify-center flex-1"
                    >
                      <Text className="text-gray-500 text-sm font-medium">
                        {cancelText}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      if (onConfirm) onConfirm();
                      else onClose(); // If no onConfirm provided, just close (useful for simple alerts)
                    }}
                    className={`py-3 px-5 rounded-lg items-center justify-center flex-1 ${
                      isDestructive ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                  >
                    <Text className="text-white text-sm font-medium">
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
