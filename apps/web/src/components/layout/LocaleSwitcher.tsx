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
      <div className="flex h-8 items-center rounded-lg border border-gray-border bg-gray-surface p-1">
        {i18nConfig.locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`rounded-lg px-2.5 py-1 text-tiny font-bold transition-all ${
              locale === loc
                ? 'bg-gray-card text-primary shadow-sm'
                : 'text-gray-muted hover:text-gray-text'
            }`}
          >
            {loc.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
