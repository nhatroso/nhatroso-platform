'use client';

import { useState } from 'react';
import MeterRequestsTable from '@/components/meter-requests/MeterRequestsTable';
import ManualGenerateModal from '@/components/meter-requests/ManualGenerateModal';
import { Icons } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MeterRequestsPage() {
  const t = useTranslations('MeterRequests');
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSuccess = (count: number) => {
    alert(t('Alerts.SuccessGenerated', { count }));
    setShowModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-2xl border border-gray-border bg-gray-card shadow-sm animate-in fade-in duration-500">
      <PageHeader
        variant="split"
        title={t('Page.RequestsTitle')}
        description={t('Page.RequestsDesc')}
        icon={Icons.Contract}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-body font-bold text-white transition-all hover:bg-primary-hover hover:shadow-md active:scale-95 shadow-sm"
          >
            <Icons.Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
            {t('Page.ManualButton')}
          </button>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center relative">
              <Icons.Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="block w-48 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>

            <div className="relative ml-auto">
              <Icons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <input
                type="text"
                placeholder={t('SearchRoomPlaceholder') || 'Tìm mã phòng...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-64 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>

            {searchTerm !== '' && (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center text-[11px] font-bold text-danger hover:text-danger-hover uppercase tracking-wider"
              >
                <Icons.Close className="mr-1 h-3.5 w-3.5" />
                {t('ClearFilters') || 'Xóa lọc'}
              </button>
            )}
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-surface/30">
        <MeterRequestsTable
          key={`${selectedPeriod}-${refreshKey}-${searchTerm}`}
          period={selectedPeriod}
          searchTerm={searchTerm}
        />
      </div>

      {showModal && (
        <ManualGenerateModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
