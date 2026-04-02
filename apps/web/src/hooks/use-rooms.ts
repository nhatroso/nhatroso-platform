import * as React from 'react';
import { Building, Floor, Room } from '@nhatroso/shared';
import { getBuildings, getAllFloors } from '@/services/api/buildings';
import { getAllRooms, createRoom } from '@/services/api/rooms';

interface UseRoomsOptions {
  initialBuildingId?: string;
  initialFloorId?: string;
}

export function useRooms(options: UseRoomsOptions = {}) {
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<string>(
    options.initialBuildingId || 'all',
  );
  const [selectedFloorId, setSelectedFloorId] = React.useState<string>(
    options.initialFloorId || 'all',
  );
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newBuildingId, setNewBuildingId] = React.useState('');
  const [newFloorId, setNewFloorId] = React.useState('');
  const [newRoomCode, setNewRoomCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [bData, fData, rData] = await Promise.all([
        getBuildings(),
        getAllFloors(),
        getAllRooms(),
      ]);
      setBuildings(bData);
      setFloors(fData);
      setRooms(rData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableFloors = React.useMemo(() => {
    if (selectedBuildingId === 'all') return floors;
    return floors.filter((f) => f.building_id === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  // If selected floor is not in available floors, reset it
  React.useEffect(() => {
    if (selectedFloorId !== 'all') {
      const exists = availableFloors.find((f) => f.id === selectedFloorId);
      if (!exists) setSelectedFloorId('all');
    }
  }, [availableFloors, selectedFloorId]);

  const filteredRooms = React.useMemo(() => {
    return rooms.filter((r) => {
      const matchBuilding =
        selectedBuildingId === 'all' || r.building_id === selectedBuildingId;
      const matchFloor =
        selectedFloorId === 'all' || r.floor_id === selectedFloorId;
      const matchStatus =
        selectedStatus === 'all' || r.status === selectedStatus;
      return matchBuilding && matchFloor && matchStatus;
    });
  }, [rooms, selectedBuildingId, selectedFloorId, selectedStatus]);

  const handleClearFilters = () => {
    setSelectedBuildingId('all');
    setSelectedFloorId('all');
    setSelectedStatus('all');
  };

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFloorId || !newRoomCode.trim()) return;
    try {
      setIsSubmitting(true);
      await createRoom(newFloorId, { code: newRoomCode });
      setIsCreateModalOpen(false);
      setNewRoomCode('');
      setNewFloorId('');
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

  const modalAvailableFloors = React.useMemo(() => {
    if (!newBuildingId) return [];
    return floors.filter((f) => f.building_id === newBuildingId);
  }, [floors, newBuildingId]);

  // Reset floor when building changes in modal
  React.useEffect(() => {
    setNewFloorId('');
  }, [newBuildingId]);

  return {
    // Data
    buildings,
    floors,
    rooms,
    availableFloors,
    filteredRooms,
    modalAvailableFloors,

    // UI State
    loading,
    selectedBuildingId,
    selectedFloorId,
    selectedStatus,
    isCreateModalOpen,
    newBuildingId,
    newFloorId,
    newRoomCode,
    isSubmitting,

    // Actions
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedStatus,
    setIsCreateModalOpen,
    setNewBuildingId,
    setNewFloorId,
    setNewRoomCode,
    handleClearFilters,
    handleCreate,
    refresh: fetchData,
  };
}
