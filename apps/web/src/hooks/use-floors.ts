import * as React from 'react';
import { Building, Floor } from '@nhatroso/shared';
import {
  getBuildings,
  getAllFloors,
  createFloor,
} from '@/services/api/buildings';

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

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newBuildingId, setNewBuildingId] = React.useState('');
  const [newFloorName, setNewFloorName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [bData, fData] = await Promise.all([
        getBuildings(),
        getAllFloors(),
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
    if (selectedBuildingId === 'all') return floors;
    return floors.filter((f) => f.building_id === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBuildingId || !newFloorName.trim()) return;
    try {
      setIsSubmitting(true);
      await createFloor(newBuildingId, { identifier: newFloorName });
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

  return {
    // Data
    buildings,
    floors,
    filteredFloors,

    // UI State
    loading,
    selectedBuildingId,
    expandedFloorId,
    isCreateModalOpen,
    newBuildingId,
    newFloorName,
    isSubmitting,

    // Actions
    setSelectedBuildingId,
    setExpandedFloorId,
    setIsCreateModalOpen,
    setNewBuildingId,
    setNewFloorName,
    handleCreate,
    toggleFloorExpansion,
    refresh: fetchData,
  };
}
