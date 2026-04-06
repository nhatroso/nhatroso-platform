import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PREDEFINED_SERVICE_IDS = [
  'electricity',
  'water',
  'internet',
  'trash',
  'management',
  'parking_moto',
  'parking_car',
  'cleaning',
  'security',
  'gas',
  'elevator',
  'laundry',
  'gym',
  'swimming_pool',
  'other',
];

export const PREDEFINED_UNIT_IDS = [
  'kWh',
  'm3',
  'month',
  'kg',
  'person',
  'time',
];

export function getServiceDisplayName(
  name: string,
  t: (key: string) => string,
) {
  try {
    if (name.startsWith('service_')) {
      const key = name.replace('service_', '');
      if (PREDEFINED_SERVICE_IDS.includes(key)) {
        return t(`Predefined_${key}`);
      }
      return name;
    }
    if (PREDEFINED_SERVICE_IDS.includes(name)) {
      return t(`Predefined_${name}`);
    }
  } catch {
    // translation key missing — fall back
  }
  return name;
}

export function getUnitDisplayName(unit: string, t: (key: string) => string) {
  try {
    if (unit.startsWith('unit_')) {
      const key = unit.replace('unit_', '');
      if (PREDEFINED_UNIT_IDS.includes(key)) {
        return t(`Unit_${key}`);
      }
      return unit;
    }
    if (PREDEFINED_UNIT_IDS.includes(unit)) {
      return t(`Unit_${unit}`);
    }
  } catch {
    // translation key missing — fall back
  }
  return unit;
}
