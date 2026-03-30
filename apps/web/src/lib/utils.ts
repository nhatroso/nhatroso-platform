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
  if (name.startsWith('service_')) {
    const key = name.replace('service_', '');
    return t(`Predefined_${key}`);
  }
  if (PREDEFINED_SERVICE_IDS.includes(name)) {
    return t(`Predefined_${name}`);
  }
  return name;
}

export function getUnitDisplayName(unit: string, t: (key: string) => string) {
  if (unit.startsWith('unit_')) {
    const key = unit.replace('unit_', '');
    return t(`Unit_${key}`);
  }
  if (PREDEFINED_UNIT_IDS.includes(unit)) {
    return t(`Unit_${unit}`);
  }
  return unit;
}
