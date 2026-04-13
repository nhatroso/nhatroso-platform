'use client';

import { useState } from 'react';
import MeterRequestsTable from '@/components/meter-requests/MeterRequestsTable';
import ManualGenerateModal from '@/components/meter-requests/ManualGenerateModal';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MeterRequestsPage() {
  const t = useTranslations('MeterRequests');
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);

  const handleSuccess = (count: number) => {
    alert(t('Alerts.SuccessGenerated', { count }));
    setShowModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        variant="full"
        title={t('Page.RequestsTitle')}
        description={t('Page.RequestsDesc')}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center">
              <label className="mr-2 text-body font-medium text-gray-text">
                {t('Period') || 'Kỳ'}:
              </label>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="py-2 px-3 block w-48 border border-gray-border bg-gray-input rounded-lg text-body focus:border-primary focus:ring-primary disabled:opacity-50 disabled:pointer-events-none"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-primary px-4 py-2 text-body font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {t('Page.ManualButton')}
            </button>
          </div>
        }
      />

      <MeterRequestsTable
        key={`${selectedPeriod}-${refreshKey}`}
        period={selectedPeriod}
      />

      {showModal && (
        <ManualGenerateModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
