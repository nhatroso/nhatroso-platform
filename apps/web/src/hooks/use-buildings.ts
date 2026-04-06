import * as React from 'react';
import { Building } from '@nhatroso/shared';
import { getBuildings } from '@/services/api/buildings';

export function useBuildings() {
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchBuildings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBuildings();
      setBuildings(data);
    } catch (err) {
      console.error('Failed to fetch buildings', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const selectedBuilding = React.useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) || null,
    [buildings, selectedBuildingId],
  );

  const handleCreateNew = () => {
    setSelectedBuildingId(null);
    setIsCreating(true);
  };

  const handleSelectBuilding = (id: string) => {
    setIsCreating(false);
    setSelectedBuildingId(id);
  };

  const handleClosePanel = () => {
    setIsCreating(false);
    setSelectedBuildingId(null);
  };

  const handleSuccess = () => {
    fetchBuildings();
    if (isCreating) {
      setIsCreating(false);
    }
  };

  return {
    buildings,
    isLoading,
    isCreating,
    selectedBuildingId,
    selectedBuilding,
    setSelectedBuildingId,
    setIsCreating,
    fetchBuildings,
    handleCreateNew,
    handleSelectBuilding,
    handleClosePanel,
    handleSuccess,
  };
}
