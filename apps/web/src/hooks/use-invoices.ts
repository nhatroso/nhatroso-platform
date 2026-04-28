import { useState, useCallback, useEffect, useMemo } from 'react';
import { Invoice, getInvoices, remindInvoice } from '@/services/api/invoices';
import { Building, Floor, Room } from '@nhatroso/shared';
import { getBuildings, getAllFloors } from '@/services/api/buildings';
import { getAllRooms } from '@/services/api/rooms';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Filter Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Filter States
  const [selectedBuildingId, setSelectedBuildingId] = useState('all');
  const [selectedFloorId, setSelectedFloorId] = useState('all');
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invData, bData, fData, rData] = await Promise.all([
        getInvoices(),
        getBuildings(),
        getAllFloors(),
        getAllRooms(),
      ]);
      setInvoices(invData);
      setBuildings(bData);
      setFloors(fData);
      setRooms(rData);
    } catch (err) {
      console.error('Failed to fetch invoice data', err);
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

  // Derived available cycles from invoices
  const availableCycles = useMemo(() => {
    const cycles = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.created_at) {
        const date = new Date(inv.created_at);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        cycles.add(`${month}/${year}`);
      }
    });
    return Array.from(cycles).sort((a, b) => {
      const [mA, yA] = a.split('/').map(Number);
      const [mB, yB] = b.split('/').map(Number);
      return yB !== yA ? yB - yA : mB - mA;
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Find room info to get building/floor
      const room = rooms.find((r) => r.id === inv.room_id);

      const matchBuilding =
        selectedBuildingId === 'all' ||
        room?.building_id === selectedBuildingId;
      const matchFloor =
        selectedFloorId === 'all' || room?.floor_id === selectedFloorId;
      const matchRoom =
        selectedRoomId === 'all' || inv.room_id === selectedRoomId;
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

      const date = new Date(inv.created_at);
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      const matchCycle = cycleFilter === 'all' || `${m}/${y}` === cycleFilter;

      const term = searchTerm.toLowerCase();
      const matchSearch =
        inv.room_code?.toLowerCase().includes(term) ||
        inv.tenant_name?.toLowerCase().includes(term);

      return (
        matchBuilding &&
        matchFloor &&
        matchRoom &&
        matchStatus &&
        matchCycle &&
        matchSearch
      );
    });
  }, [
    invoices,
    rooms,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    statusFilter,
    cycleFilter,
    searchTerm,
  ]);

  const handleCreateNew = () => setIsCreating(true);
  const handleClosePanel = () => setIsCreating(false);
  const handleSuccess = () => {
    fetchData();
    setIsCreating(false);
  };

  const handleRemind = async (id: number) => {
    try {
      await remindInvoice(id);
      return true;
    } catch (err) {
      console.error('Failed to send reminder', err);
      return false;
    }
  };

  return {
    invoices: filteredInvoices,
    allInvoices: invoices,
    buildings,
    availableFloors,
    availableRooms,
    availableCycles,
    isLoading,
    isCreating,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    statusFilter,
    cycleFilter,
    searchTerm,
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedRoomId,
    setStatusFilter,
    setCycleFilter,
    setSearchTerm,
    handleCreateNew,
    handleClosePanel,
    handleSuccess,
    handleRemind,
    refresh: fetchData,
  };
}
