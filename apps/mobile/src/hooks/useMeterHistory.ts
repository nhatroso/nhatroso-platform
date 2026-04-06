import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/src/api/meter';

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export function useMeterHistory() {
  const { meterId, serviceName, unit } = useLocalSearchParams<{
    meterId: string;
    serviceName: string;
    unit: string;
  }>();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: readings, isLoading } = useQuery({
    queryKey: ['meter-readings', meterId],
    queryFn: () => meterService.getReadings(meterId || ''),
    enabled: !!meterId,
  });

  const sortedReadings = Array.isArray(readings)
    ? [...readings]
        .filter(
          (r) =>
            r.status === 'SUBMITTED' ||
            !r.status ||
            (r.reading_value && parseFloat(r.reading_value) > 0),
        )
        .sort(
          (a, b) =>
            new Date(b.reading_date).getTime() -
            new Date(a.reading_date).getTime(),
        )
    : [];

  return {
    meterId,
    serviceName,
    unit,
    isLoading,
    sortedReadings,
    selectedImage,
    setSelectedImage,
    formatDate,
  };
}
