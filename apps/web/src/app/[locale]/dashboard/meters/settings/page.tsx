'use client';

import MeterConfigForm from '@/components/meter-requests/MeterConfigForm';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MeterSettingsPage() {
  const t = useTranslations('MeterRequests.Page');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        variant="full"
        title={t('SettingsTitle')}
        description={t('SettingsDesc')}
      />

      <MeterConfigForm />
    </div>
  );
}
