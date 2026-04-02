'use client';

import MeterConfigForm from '@/components/meter-requests/MeterConfigForm';
import { useTranslations } from 'next-intl';

export default function MeterSettingsPage() {
  const t = useTranslations('MeterRequests.Page');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('SettingsTitle')}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('SettingsDesc')}
        </p>
      </div>

      <MeterConfigForm />
    </div>
  );
}
