import { useTranslation } from 'react-i18next';

export function useServiceLabel() {
  const { t } = useTranslation();

  return (name?: string | null): string => {
    if (!name) return '';
    const lower = name.toLowerCase();

    // Exact matches or includes
    if (lower.includes('electricity'))
      return t('Services.Predefined_electricity');
    if (lower.includes('water')) return t('Services.Predefined_water');
    if (lower.includes('internet')) return t('Services.Predefined_internet');
    if (lower.includes('trash')) return t('Services.Predefined_trash');
    if (lower.includes('management'))
      return t('Services.Predefined_management');
    if (lower.includes('parking')) return t('Services.Predefined_parking_moto');
    if (lower.includes('cleaning')) return t('Services.Predefined_cleaning');
    if (lower.includes('security')) return t('Services.Predefined_security');
    if (lower.includes('gas')) return t('Services.Predefined_gas');
    if (lower.includes('elevator')) return t('Services.Predefined_elevator');
    if (lower.includes('laundry')) return t('Services.Predefined_laundry');
    if (lower.includes('gym')) return t('Services.Predefined_gym');
    if (lower.includes('swimming_pool'))
      return t('Services.Predefined_swimming_pool');
    if (lower.includes('other')) return t('Services.Predefined_other');

    return name;
  };
}

export function useUnitLabel() {
  const { t } = useTranslation();

  return (unit?: string | null): string => {
    if (!unit) return '';
    const key = `Services.Unit_${unit}`;
    // fallback to translating via t and returning original if no key found (handled by i18next)
    return t(key, unit);
  };
}
