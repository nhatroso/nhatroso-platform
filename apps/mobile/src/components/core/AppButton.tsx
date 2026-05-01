import React from 'react';
import { Button as PaperButton } from 'react-native-paper';

interface ButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  className?: string;
}

export function AppButton({
  onPress,
  label,
  loading,
  disabled,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  let buttonColor = '#2563EB'; // blue-600
  let textColor = '#FFFFFF';
  let mode: 'contained' | 'outlined' | 'text' = 'contained';

  if (isDanger) {
    buttonColor = '#EF4444'; // red-500
    textColor = '#FFFFFF';
  } else if (!isPrimary) {
    buttonColor = 'transparent';
    textColor = '#374151';
    mode = 'outlined';
  }

  if (disabled) {
    textColor = '#9CA3AF';
    if (mode === 'contained') {
      buttonColor = '#E5E7EB'; // gray-200
    }
  }

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      buttonColor={buttonColor}
      className={`rounded-full justify-center ${className}`}
      labelStyle={{
        fontSize: 16,
        fontWeight: 'bold',
        color: textColor,
        paddingVertical: 4,
      }}
      contentStyle={{ height: 52 }}
    >
      {label}
    </PaperButton>
  );
}
