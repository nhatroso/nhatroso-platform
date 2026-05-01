import * as React from 'react';
import { Building } from '@nhatroso/shared';
import { metersService, LandlordMeterReadingDetail } from '@/services/api/meters';
import { buildingsService } from '@/services/api/buildings';

export function useLandlordReadings() {
  const [readings, setReadings] = React.useState<LandlordMeterReadingDetail[]>([]);
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedBuilding, setSelectedBuilding] = React.useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>(
    new Date().toISOString().slice(0, 7),
  );
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const fetchBuildings = React.useCallback(async () => {
    try {
      const data = await buildingsService.getBuildings();
      setBuildings(data);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  }, []);

  const fetchReadings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await metersService.listLandlordReadings({
        buildingId: selectedBuilding === 'all' ? undefined : selectedBuilding,
        periodMonth: selectedPeriod,
      });
      setReadings(data);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBuilding, selectedPeriod]);

  React.useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  React.useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const filteredReadings = React.useMemo(() => {
    return readings.filter((r) => {
      const matchesSearch =
        r.room_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.building_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [readings, searchTerm, statusFilter]);

  const clearFilters = () => {
    setSelectedBuilding('all');
    setSearchTerm('');
    setStatusFilter('all');
  };

  return {
    readings: filteredReadings,
    buildings,
    loading,
    selectedBuilding,
    setSelectedBuilding,
    selectedPeriod,
    setSelectedPeriod,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clearFilters,
    refresh: fetchReadings,
  };
}
