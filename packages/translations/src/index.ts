import viErrors from './locales/vi/errors.json';
import enErrors from './locales/en/errors.json';
import viAuth from './locales/vi/auth.json';
import enAuth from './locales/en/auth.json';

export const i18nConfig = {
  locales: ['vi', 'en'] as const,
  defaultLocale: 'vi' as const,
};

export type Locale = (typeof i18nConfig.locales)[number];

export const translations = {
  vi: {
    errors: viErrors,
    auth: viAuth,
  },
  en: {
    errors: enErrors,
    auth: enAuth,
  },
};

export type AppTranslations = typeof translations.vi;
