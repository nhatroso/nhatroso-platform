import * as React from 'react';
import { Building, Floor } from '@nhatroso/shared';
import { buildingsService } from '@/services/api/buildings';

interface UseFloorsOptions {
  initialBuildingId?: string;
}

export function useFloors(options: UseFloorsOptions = {}) {
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<string>(
    options.initialBuildingId || 'all',
  );
  const [expandedFloorId, setExpandedFloorId] = React.useState<string | null>(
    null,
  );

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [floorFilter, setFloorFilter] = React.useState('all');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newBuildingId, setNewBuildingId] = React.useState('');
  const [newFloorName, setNewFloorName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [bData, fData] = await Promise.all([
        buildingsService.getBuildings(),
        buildingsService.getAllFloors(),
      ]);
      setBuildings(bData);
      setFloors(fData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredFloors = React.useMemo(() => {
    let result = floors;
    if (selectedBuildingId !== 'all') {
      result = result.filter((f) => f.building_id === selectedBuildingId);
    }
    return result;
  }, [floors, selectedBuildingId]);

  const uniqueFloorIdentifiers = React.useMemo(() => {
    const ids = floors.map((f) => f.identifier);
    return Array.from(new Set(ids)).sort();
  }, [floors]);

  const filteredAndSearchedFloors = React.useMemo(() => {
    return filteredFloors.filter((f) => {
      const matchSearch = f.identifier
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchFloor = floorFilter === 'all' || f.identifier === floorFilter;
      return matchSearch && matchStatus && matchFloor;
    });
  }, [filteredFloors, searchTerm, statusFilter, floorFilter]);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBuildingId || !newFloorName.trim()) return;
    try {
      setIsSubmitting(true);
      await buildingsService.createFloor(newBuildingId, {
        identifier: newFloorName,
      });
      setIsCreateModalOpen(false);
      setNewFloorName('');
      setNewBuildingId('');

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFloorExpansion = (floorId: string) => {
    setExpandedFloorId((prev) => (prev === floorId ? null : floorId));
  };

  const clearFilters = () => {
    setSelectedBuildingId('all');
    setSearchTerm('');
    setStatusFilter('all');
    setFloorFilter('all');
  };

  return {
    // Data
    buildings,
    floors,
    filteredAndSearchedFloors,
    uniqueFloorIdentifiers,

    // UI State
    loading,
    selectedBuildingId,
    expandedFloorId,
    isCreateModalOpen,
    newBuildingId,
    newFloorName,
    isSubmitting,
    searchTerm,
    statusFilter,
    floorFilter,

    // Actions
    setSelectedBuildingId,
    setExpandedFloorId,
    setIsCreateModalOpen,
    setNewBuildingId,
    setNewFloorName,
    setSearchTerm,
    setStatusFilter,
    setFloorFilter,
    handleCreate,
    toggleFloorExpansion,
    clearFilters,
    refresh: fetchData,
  };
}
