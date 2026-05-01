import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Service, PriceRule, PREDEFINED_SERVICES } from '@nhatroso/shared';
import { servicesService } from '@/services/api/services';
import { priceRulesService } from '@/services/api/price-rules';

export function useServices() {
  const t = useTranslations('Services');

  const [services, setServices] = React.useState<Service[]>([]);
  const [serviceRules, setServiceRules] = React.useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedServiceId, setSelectedServiceId] = React.useState<
    string | null
  >(null);

  // Template Form
  const [templateName, setTemplateName] = React.useState(t('StandardPrice'));
  const [templatePrice, setTemplatePrice] = React.useState('');
  const [isSavingTemplate, setIsSavingTemplate] = React.useState(false);
  const [editingRuleId, setEditingRuleId] = React.useState<string | null>(null);

  // Quick Add
  const [quickAddData, setQuickAddData] = React.useState<{
    id_key: string;
    unit_key: string;
  } | null>(null);
  const [quickAddPrice, setQuickAddPrice] = React.useState('');
  const [predefinedSearch, setPredefinedSearch] = React.useState('');

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const srvs = await servicesService.list();
      setServices(srvs);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRulesForService = React.useCallback(async (serviceId: string) => {
    try {
      const rules = await priceRulesService.listByService(serviceId);
      setServiceRules(rules.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to fetch service rules', err);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  React.useEffect(() => {
    if (selectedServiceId) {
      fetchRulesForService(selectedServiceId);
      setTemplatePrice('');
      setTemplateName(t('StandardPrice'));
      setEditingRuleId(null);
    } else {
      setServiceRules([]);
    }
  }, [selectedServiceId, fetchRulesForService, t]);

  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  const activeServices = React.useMemo(() => {
    return services.filter((s) => s.status === 'ACTIVE');
  }, [services]);

  const availablePredefined = React.useMemo(() => {
    return PREDEFINED_SERVICES.filter((ps) => {
      const existing = services.find(
        (s) => s.name === ps.id_key || s.name === `service_${ps.id_key}`,
      );
      if (existing && existing.status === 'ACTIVE') return false;

      if (predefinedSearch) {
        const translatedName = t('Predefined_' + ps.id_key).toLowerCase();
        return translatedName.includes(predefinedSearch.toLowerCase());
      }

      return true;
    });
  }, [services, predefinedSearch, t]);

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    setQuickAddData(null);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !templatePrice || !templateName) return;

    setIsSavingTemplate(true);
    try {
      if (editingRuleId) {
        await priceRulesService.update(editingRuleId, {
          unit_price: Number(templatePrice),
          name: templateName,
        });
      } else {
        await priceRulesService.create({
          service_id: selectedServiceId,
          unit_price: Number(templatePrice),
          name: templateName,
        });
      }
      setTemplatePrice('');
      setTemplateName(t('StandardPrice'));
      setEditingRuleId(null);
      await fetchRulesForService(selectedServiceId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('ErrorSavingPriceTemplate'));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedServiceId) return;
    if (!confirm(t('ConfirmArchive'))) return;
    try {
      await servicesService.archive(selectedServiceId);
      setSelectedServiceId(null);
      await fetchServices();
    } catch (err) {
      console.error('Failed to archive', err);
    }
  };

  const handleQuickAdd = (id_key: string, unit_key: string) => {
    setQuickAddData({ id_key, unit_key });
    setQuickAddPrice('');
    setSelectedServiceId(null);
  };

  const handleConfirmQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddData || !quickAddPrice) return;

    try {
      setIsLoading(true);
      const srv = await servicesService.create({
        name: quickAddData.id_key,
        unit: quickAddData.unit_key,
      });

      await priceRulesService.create({
        service_id: srv.id,
        unit_price: Number(quickAddPrice),
        name: t('StandardPrice'),
      });

      setQuickAddData(null);
      setQuickAddPrice('');
      await fetchServices();
      setSelectedServiceId(srv.id);
    } catch (err: unknown) {
      console.error('Quick add failed', err);
      alert(err instanceof Error ? err.message : t('ErrorQuickAdd'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    if (!selectedServiceId) return;
    if (confirm(t('ConfirmDeleteTemplate'))) {
      try {
        await priceRulesService.remove(ruleId);
        await fetchRulesForService(selectedServiceId);
      } catch (err) {
        console.error('Failed to remove rule', err);
      }
    }
  };

  const startEditRule = (rule: PriceRule) => {
    setEditingRuleId(rule.id);
    setTemplatePrice(String(rule.unit_price));
    setTemplateName(rule.name);
  };

  return {
    services,
    serviceRules,
    isLoading,
    selectedServiceId,
    selectedService,
    activeServices,
    availablePredefined,

    templateName,
    templatePrice,
    isSavingTemplate,
    editingRuleId,
    setTemplateName,
    setTemplatePrice,
    setEditingRuleId,

    quickAddData,
    quickAddPrice,
    predefinedSearch,
    setQuickAddData,
    setQuickAddPrice,
    setPredefinedSearch,

    handleSelectService,
    handleSaveTemplate,
    handleArchive,
    handleQuickAdd,
    handleConfirmQuickAdd,
    handleRemoveRule,
    startEditRule,
    setSelectedServiceId,
  };
}
