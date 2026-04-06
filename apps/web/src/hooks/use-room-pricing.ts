import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room, Service, PriceRule, RoomService, Meter } from '@nhatroso/shared';
import { servicesApi } from '@/services/api/services';
import { priceRulesApi } from '@/services/api/price-rules';
import { roomServicesApi } from '@/services/api/room-services';
import { metersApi } from '@/services/api/meters';

function isUtilityService(name?: string | null): boolean {
  const lower = (name || '').toLowerCase();
  return lower.includes('electricity') || lower.includes('water');
}

export function useRoomPricing(room: Room) {
  const tServices = useTranslations('Services');

  const [services, setServices] = React.useState<Service[]>([]);
  const [roomServices, setRoomServices] = React.useState<RoomService[]>([]);
  const [serviceTemplates, setServiceTemplates] = React.useState<PriceRule[]>(
    [],
  );
  const [meters, setMeters] = React.useState<Meter[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [selectedServiceId, setSelectedServiceId] = React.useState<
    string | null
  >(null);

  const [stagedIsActive, setStagedIsActive] = React.useState(false);
  const [stagedPriceRuleId, setStagedPriceRuleId] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Initial meter reading for utility services
  const [initialMeterReading, setInitialMeterReading] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [allServices, assignedServices, roomMeters] = await Promise.all([
        servicesApi.list(),
        roomServicesApi.listByRoom(room.id),
        metersApi.listByRoom(room.id),
      ]);

      const activeServices = allServices.filter((s) => s.status === 'ACTIVE');
      setServices(activeServices);
      setRoomServices(assignedServices);
      setMeters(roomMeters);

      if (activeServices.length > 0 && !selectedServiceId) {
        setSelectedServiceId(activeServices[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [room.id, selectedServiceId]);

  const fetchTemplates = React.useCallback(async (serviceId: string) => {
    try {
      const templates = await priceRulesApi.listByService(serviceId);
      setServiceTemplates(
        templates.sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    if (selectedServiceId) {
      fetchTemplates(selectedServiceId);

      const assigned = roomServices.find(
        (rs) => rs.service_id === selectedServiceId,
      );

      if (assigned) {
        setStagedIsActive(assigned.is_active);
        setStagedPriceRuleId(assigned.price_rule_id || '');
      } else {
        setStagedIsActive(false);
        setStagedPriceRuleId('');
      }

      setErrorMsg('');
      setInitialMeterReading('');
    }
  }, [selectedServiceId, roomServices, fetchTemplates]);

  // Auto-select first template if active but no template selected
  React.useEffect(() => {
    if (stagedIsActive && !stagedPriceRuleId && serviceTemplates.length > 0) {
      setStagedPriceRuleId(serviceTemplates[0].id);
    }
  }, [stagedIsActive, stagedPriceRuleId, serviceTemplates]);

  const activeService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId],
  );

  const assignedRecord = React.useMemo(
    () => roomServices.find((rs) => rs.service_id === selectedServiceId),
    [roomServices, selectedServiceId],
  );

  const isActuallyEnabled = !!assignedRecord;

  // ACTIVE Meter exists for this service?
  const activeMeter = React.useMemo(() => {
    return meters.find(
      (m) => m.service_id === selectedServiceId && m.status === 'ACTIVE',
    );
  }, [meters, selectedServiceId]);

  const meterAlreadyExists = !!activeMeter;

  const isNewUtilityActivation = React.useMemo(
    () =>
      stagedIsActive &&
      !isActuallyEnabled &&
      isUtilityService(activeService?.name) &&
      !meterAlreadyExists,
    [stagedIsActive, isActuallyEnabled, activeService, meterAlreadyExists],
  );

  const handleSave = async () => {
    if (!selectedServiceId) return;

    // Validation: If enabled, must have a template
    if (stagedIsActive && !stagedPriceRuleId) {
      setErrorMsg(tServices('ErrorSelectPriceRule'));
      return;
    }

    // Validation: new utility service must have initial reading
    if (isNewUtilityActivation && !initialMeterReading) {
      setErrorMsg(tServices('InitialReadingRequired'));
      return;
    }

    setErrorMsg('');
    setIsSaving(true);

    try {
      const assigned = roomServices.find(
        (rs) => rs.service_id === selectedServiceId,
      );

      if (stagedIsActive) {
        if (!assigned) {
          // New assignment
          await roomServicesApi.assign(room.id, {
            service_id: selectedServiceId,
            price_rule_id: stagedPriceRuleId,
          });

          // Auto-create meter with initial reading for utility services
          if (isNewUtilityActivation) {
            try {
              await metersApi.create({
                room_id: room.id,
                service_id: selectedServiceId,
                initial_reading: initialMeterReading || '0',
              });
            } catch {
              // Meter might already exist, not fatal
            }
          }
        } else {
          // Update existing assignment
          await roomServicesApi.update(room.id, assigned.id, {
            price_rule_id: stagedPriceRuleId,
            is_active: true,
          });
        }
      } else {
        // Disabling
        if (assigned) {
          await roomServicesApi.remove(room.id, assigned.id);

          // Deactivate the active meter if it exists for this service
          if (activeMeter) {
            try {
              await metersApi.updateStatus(activeMeter.id, 'INACTIVE');
            } catch (err) {
              console.error('Failed to deactivate meter', err);
            }
          }
        }
      }

      // Reload room services and meters
      const [assignedServices, roomMeters] = await Promise.all([
        roomServicesApi.listByRoom(room.id),
        metersApi.listByRoom(room.id),
      ]);
      setRoomServices(assignedServices);
      setMeters(roomMeters);
      setErrorMsg('');
      setInitialMeterReading('');
      alert(tServices('SuccessSaveConfig'));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : tServices('SaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // Data
    services,
    roomServices,
    serviceTemplates,
    activeService,
    activeMeter,

    // UI State
    loading,
    isSaving,
    selectedServiceId,
    stagedIsActive,
    stagedPriceRuleId,
    initialMeterReading,
    errorMsg,

    // Status helpers
    isActuallyEnabled,
    isNewUtilityActivation,

    // Actions
    setSelectedServiceId,
    setStagedIsActive,
    setStagedPriceRuleId,
    setInitialMeterReading,
    handleSave,
    setErrorMsg,
    refresh: fetchData,
  };
}
