import viErrors from './locales/vi/errors.json';
import enErrors from './locales/en/errors.json';
import viAuth from './locales/vi/auth.json';
import enAuth from './locales/en/auth.json';
import viBuildings from './locales/vi/buildings.json';
import enBuildings from './locales/en/buildings.json';
import viServices from './locales/vi/services.json';
import enServices from './locales/en/services.json';

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
  },
  en: {
    Errors: enErrors,
    Auth: enAuth,
    Buildings: enBuildings,
    Services: enServices,
  },
};

export type AppTranslations = typeof translations.vi;
