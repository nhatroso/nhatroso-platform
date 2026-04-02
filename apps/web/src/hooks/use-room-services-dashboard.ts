import * as React from 'react';
import { Building, Floor, Room, Meter } from '@nhatroso/shared';
import { getBuildings, getAllFloors } from '@/services/api/buildings';
import { getAllRooms } from '@/services/api/rooms';
import { metersApi } from '@/services/api/meters';

export function useRoomServicesDashboard() {
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  // Map of roomId -> meters
  const [roomMeters, setRoomMeters] = React.useState<Map<string, Meter[]>>(
    new Map(),
  );

  const [selectedBuildingId, setSelectedBuildingId] =
    React.useState<string>('all');
  const [selectedFloorId, setSelectedFloorId] = React.useState<string>('all');
  const [selectedStatus, setSelectedStatus] =
    React.useState<string>('OCCUPIED');

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

      // Fetch meters for all rooms in parallel
      const metersEntries = await Promise.all(
        rData.map(async (rm) => {
          try {
            const meters = await metersApi.listByRoom(rm.id);
            return [rm.id, meters.filter((m) => m.status === 'ACTIVE')] as [
              string,
              Meter[],
            ];
          } catch {
            return [rm.id, []] as [string, Meter[]];
          }
        }),
      );
      setRoomMeters(new Map(metersEntries));
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

  return {
    // Data
    buildings,
    floors,
    rooms,
    roomMeters,
    availableFloors,
    filteredRooms,

    // UI State
    loading,
    selectedBuildingId,
    selectedFloorId,
    selectedStatus,

    // Actions
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedStatus,
    refresh: fetchData,
  };
}
