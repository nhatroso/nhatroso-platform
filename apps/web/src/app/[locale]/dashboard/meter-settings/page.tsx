'use client';

import MeterConfigForm from '@/components/meter-requests/MeterConfigForm';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MeterSettingsPage() {
  const t = useTranslations('MeterRequests.Page');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        variant="full"
        title={t('SettingsTitle')}
        description={t('SettingsDesc')}
      />

      <MeterConfigForm />
    </div>
  );
}
