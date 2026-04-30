import * as React from 'react';
import {
  LandlordMeterSummary,
  LandlordMeterDetail,
  Building,
} from '@nhatroso/shared';
import { metersService } from '@/services/api/meters';
import { buildingsService } from '@/services/api/buildings';

export function useLandlordMeters() {
  const [summary, setSummary] = React.useState<LandlordMeterSummary | null>(null);
  const [meters, setMeters] = React.useState<LandlordMeterDetail[]>([]);
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [selectedBuilding, setSelectedBuilding] = React.useState<string>('all');
  const [statusFilter] = React.useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'OVERDUE'>(
    'ALL',
  );
  const [serviceFilter, setServiceFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = React.useState(currentPeriod);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, buildingsData] = await Promise.all([
        metersService.getLandlordSummary(selectedPeriod),
        buildingsService.getBuildings(),
      ]);
      setSummary(summaryData);
      setBuildings(buildingsData);

      const metersData = await metersService.listLandlordMeters(
        selectedBuilding === 'all' ? undefined : selectedBuilding,
        selectedPeriod,
      );
      setMeters(metersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBuilding, selectedPeriod]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMeters = React.useMemo(() => {
    return meters.filter((m) => {
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchesService =
        serviceFilter === 'all' || m.service_name === serviceFilter;
      const matchesSearch =
        m.room_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesService && matchesSearch;
    });
  }, [meters, statusFilter, serviceFilter, searchQuery]);

  const serviceOptions = React.useMemo(() => {
    return Array.from(new Set(meters.map((m) => m.service_name)));
  }, [meters]);

  return {
    summary,
    meters,
    buildings,
    loading,
    selectedBuilding,
    setSelectedBuilding,
    statusFilter,
    serviceFilter,
    setServiceFilter,
    searchQuery,
    setSearchQuery,
    selectedPeriod,
    setSelectedPeriod,
    filteredMeters,
    serviceOptions,
    refresh: fetchData,
  };
}
