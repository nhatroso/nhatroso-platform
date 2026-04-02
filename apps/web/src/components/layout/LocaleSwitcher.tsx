'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { i18nConfig } from '@nhatroso/translations';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const segments = pathname.split('/');
    const currentFirstSegment = segments[1];

    if (
      i18nConfig.locales.includes(
        currentFirstSegment as (typeof i18nConfig.locales)[number],
      )
    ) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    const newPathname = segments.join('/') || '/';
    router.push(newPathname);
  };

  return (
    <div className="flex items-center">
      <div className="flex h-8 items-center rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-700/50">
        {i18nConfig.locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              locale === loc
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {loc.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
