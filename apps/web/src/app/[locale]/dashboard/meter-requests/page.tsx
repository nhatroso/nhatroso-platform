'use client';

import { useState } from 'react';
import MeterRequestsTable from '@/components/meter-requests/MeterRequestsTable';
import ManualGenerateModal from '@/components/meter-requests/ManualGenerateModal';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MeterRequestsPage() {
  const t = useTranslations('MeterRequests');
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = (count: number) => {
    alert(t('Alerts.SuccessGenerated', { count }));
    setShowModal(false);
    setRefreshKey((prev) => prev + 1);
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('Page.RequestsTitle')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Page.RequestsDesc')}
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('Page.ManualButton')}
          </button>
        </div>
      </div>

      <MeterRequestsTable key={refreshKey} />

      {showModal && (
        <ManualGenerateModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
