import { useState, useCallback, useEffect, useMemo } from 'react';
import { ContractResponse, Building, Floor, Room } from '@nhatroso/shared';
import { contractsService } from '@/services/api/contracts';
import { getBuildings, getAllFloors } from '@/services/api/buildings';
import { getAllRooms } from '@/services/api/rooms';

export function useContracts() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Filter States
  const [selectedBuildingId, setSelectedBuildingId] = useState('all');
  const [selectedFloorId, setSelectedFloorId] = useState('all');
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cData, bData, fData, rData] = await Promise.all([
        contractsService.list(),
        getBuildings(),
        getAllFloors(),
        getAllRooms(),
      ]);
      setContracts(cData);
      setBuildings(bData);
      setFloors(fData);
      setRooms(rData);
    } catch (err) {
      console.error('Failed to fetch contract data', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableFloors = useMemo(() => {
    if (selectedBuildingId === 'all') return floors;
    return floors.filter((f) => f.building_id === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  const availableRooms = useMemo(() => {
    let rs = rooms;
    if (selectedBuildingId !== 'all') {
      rs = rs.filter((r) => r.building_id === selectedBuildingId);
    }
    if (selectedFloorId !== 'all') {
      rs = rs.filter((r) => r.floor_id === selectedFloorId);
    }
    return rs;
  }, [rooms, selectedBuildingId, selectedFloorId]);

  const filteredContracts = useMemo(() => {
    const enriched = contracts.map((c) => {
      const end = new Date(c.end_date);
      const now = new Date();
      const diffDays = Math.ceil(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let calculatedStatus = c.status;
      if (c.status === 'ACTIVE' && diffDays <= 30 && diffDays > 0) {
        calculatedStatus = 'ABOUT_TO_EXPIRE';
      } else if (c.status === 'ACTIVE' && diffDays <= 0) {
        calculatedStatus = 'EXPIRED';
      }

      return { ...c, calculatedStatus };
    });

    return enriched.filter((c) => {
      // Find room info to get building/floor
      const room = rooms.find((r) => r.id === c.room_id);

      const matchBuilding =
        selectedBuildingId === 'all' ||
        room?.building_id === selectedBuildingId;
      const matchFloor =
        selectedFloorId === 'all' || room?.floor_id === selectedFloorId;
      const matchRoom =
        selectedRoomId === 'all' || c.room_id === selectedRoomId;

      let matchTab = true;
      if (statusFilter === 'ACTIVE') {
        matchTab =
          c.calculatedStatus === 'ACTIVE' ||
          c.calculatedStatus === 'ABOUT_TO_EXPIRE';
      } else if (statusFilter !== 'ALL') {
        matchTab = c.calculatedStatus === statusFilter;
      }

      const term = searchTerm.toLowerCase();
      const matchSearch =
        c.tenant_name?.toLowerCase().includes(term) ||
        c.room_code?.toLowerCase().includes(term);

      return (
        matchBuilding && matchFloor && matchRoom && matchTab && matchSearch
      );
    });
  }, [
    contracts,
    rooms,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    statusFilter,
    searchTerm,
  ]);

  return {
    contracts: filteredContracts,
    buildings,
    availableFloors,
    availableRooms,
    isLoading,
    error,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    statusFilter,
    searchTerm,
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedRoomId,
    setStatusFilter,
    setSearchTerm,
    refresh: fetchData,
  };
}
