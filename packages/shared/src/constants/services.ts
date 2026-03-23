export const PREDEFINED_SERVICES = [
  { id_key: 'electricity', unit_key: 'kWh' },
  { id_key: 'water', unit_key: 'm3' },
  { id_key: 'internet', unit_key: 'month' },
  { id_key: 'trash', unit_key: 'month' },
  { id_key: 'management', unit_key: 'month' },
  { id_key: 'parking_moto', unit_key: 'month' },
  { id_key: 'parking_car', unit_key: 'month' },
  { id_key: 'cleaning', unit_key: 'month' },
  { id_key: 'security', unit_key: 'month' },
  { id_key: 'gas', unit_key: 'kg' },
  { id_key: 'elevator', unit_key: 'month' },
  { id_key: 'laundry', unit_key: 'kg' },
  { id_key: 'gym', unit_key: 'month' },
  { id_key: 'swimming_pool', unit_key: 'month' },
  { id_key: 'other', unit_key: 'month' },
];

export const PREDEFINED_SERVICE_IDS = PREDEFINED_SERVICES.map((s) => s.id_key);

export const PREDEFINED_UNIT_IDS = [
  'kWh',
  'm3',
  'month',
  'kg',
  'person',
  'time',
];
