import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { i18nConfig, translations, Locale } from '@nhatroso/translations';

export default getRequestConfig(async ({ requestLocale }) => {
  // Use 'vi' as default if locale is missing or invalid
  const locale = (await requestLocale) || i18nConfig.defaultLocale;

  if (!i18nConfig.locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: translations[locale as Locale],
  };
});
