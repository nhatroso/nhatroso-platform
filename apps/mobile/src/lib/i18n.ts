import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations, i18nConfig } from '@nhatroso/translations';

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    vi: { translation: translations.vi },
  },
  lng: i18nConfig.defaultLocale,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
