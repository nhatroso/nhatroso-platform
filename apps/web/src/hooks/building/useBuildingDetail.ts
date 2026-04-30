import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Building,
  CreateBuildingInput,
  UpdateBuildingInput,
} from '@nhatroso/shared';
import { buildingsService } from '@/services/api/buildings';

interface UseBuildingDetailOptions {
  building: Building | null;
  isCreating: boolean;
  onSuccess: () => void;
}

export function useBuildingDetail({
  building,
  isCreating,
  onSuccess,
}: UseBuildingDetailOptions) {
  const tErr = useTranslations('Errors');

  const [name, setName] = React.useState(building?.name || '');
  const [address, setAddress] = React.useState(building?.address || '');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setName(building?.name || '');
    setAddress(building?.address || '');
    setError(null);
  }, [building, isCreating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isCreating) {
        const payload: CreateBuildingInput = {
          name,
          address: address || undefined,
        };
        await buildingsService.createBuilding(payload);
      } else if (building) {
        const payload: UpdateBuildingInput = {
          name,
          address: address || undefined,
        };
        await buildingsService.updateBuilding(building.id, payload);
      }
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'RESOURCE_ARCHIVED') {
        setError(tErr('BUILDING_UPDATE_ARCHIVED'));
      } else {
        setError(tErr('UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!building) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await buildingsService.archiveBuilding(building.id);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'BUILDING_HAS_ACTIVE_ROOMS') {
        setError(tErr('BUILDING_HAS_ACTIVE_ROOMS'));
      } else {
        setError(tErr('UNKNOWN_ERROR'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    address,
    setAddress,
    error,
    isSubmitting,
    handleSubmit,
    handleArchive,
  };
}
