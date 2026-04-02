import * as React from 'react';
import { Room, Meter, MeterReading } from '@nhatroso/shared';
import { metersApi } from '@/services/api/meters';

export function useMeterManagement(room: Room) {
  const [meters, setMeters] = React.useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = React.useState<Meter | null>(null);
  const [readings, setReadings] = React.useState<MeterReading[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [newReadingValue, setNewReadingValue] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);

  const fetchMeters = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await metersApi.listByRoom(room.id);
      const activeMeters = data.filter((m) => m.status === 'ACTIVE');
      setMeters(activeMeters);
      if (activeMeters.length > 0 && !selectedMeter) {
        setSelectedMeter(activeMeters[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [room.id, selectedMeter]);

  const fetchReadings = React.useCallback(async (meterId: string) => {
    try {
      const data = await metersApi.listReadings(meterId);
      setReadings(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  React.useEffect(() => {
    if (selectedMeter) {
      fetchReadings(selectedMeter.id);
    }
  }, [selectedMeter, fetchReadings]);

  const handleRecordReading = async () => {
    if (!selectedMeter || !newReadingValue) return;
    try {
      setSubmitting(true);
      await metersApi.recordReading(selectedMeter.id, {
        reading_value: newReadingValue,
        reading_date: new Date().toISOString(),
      });
      setNewReadingValue('');
      setIsRecording(false);
      fetchReadings(selectedMeter.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    meters,
    selectedMeter,
    readings,
    loading,
    submitting,
    newReadingValue,
    isRecording,
    setSelectedMeter,
    setNewReadingValue,
    setIsRecording,
    handleRecordReading,
    refreshMeters: fetchMeters,
    refreshReadings: () => selectedMeter && fetchReadings(selectedMeter.id),
  };
}
