import viErrors from './locales/vi/errors.json';
import enErrors from './locales/en/errors.json';
import viAuth from './locales/vi/auth.json';
import enAuth from './locales/en/auth.json';
import viBuildings from './locales/vi/buildings.json';
import enBuildings from './locales/en/buildings.json';
import viServices from './locales/vi/services.json';
import enServices from './locales/en/services.json';
import viSidebar from './locales/vi/sidebar.json';
import enSidebar from './locales/en/sidebar.json';
import viDashboard from './locales/vi/dashboard.json';
import enDashboard from './locales/en/dashboard.json';
import viMeters from './locales/vi/meters.json';
import enMeters from './locales/en/meters.json';
import viMeterRequests from './locales/vi/meter_requests.json';
import enMeterRequests from './locales/en/meter_requests.json';
import viRoomServices from './locales/vi/room_services.json';
import enRoomServices from './locales/en/room_services.json';

export const i18nConfig = {
  locales: ['vi', 'en'] as const,
  defaultLocale: 'vi' as const,
};

export type Locale = (typeof i18nConfig.locales)[number];

export const translations = {
  vi: {
    Errors: viErrors,
    Auth: viAuth,
    Buildings: viBuildings,
    Services: viServices,
    Sidebar: viSidebar,
    Dashboard: viDashboard,
    Meters: viMeters,
    MeterRequests: viMeterRequests,
    RoomServices: viRoomServices,
  },
  en: {
    Errors: enErrors,
    Auth: enAuth,
    Buildings: enBuildings,
    Services: enServices,
    Sidebar: enSidebar,
    Dashboard: enDashboard,
    Meters: enMeters,
    MeterRequests: enMeterRequests,
    RoomServices: enRoomServices,
  },
};

export type AppTranslations = typeof translations.vi;
