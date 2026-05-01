'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { PageHeader } from '@/components/ui/PageHeader';

import { useLandlordReadings } from '@/hooks/meter/useLandlordReadings';

export default function MeterReadingsPage() {
  const t = useTranslations('Meters');
  const {
    readings: filteredReadings,
    buildings,
    loading,
    selectedBuilding,
    setSelectedBuilding,
    selectedPeriod,
    setSelectedPeriod,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
  } = useLandlordReadings();

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-2xl border border-gray-border bg-gray-card shadow-sm animate-in fade-in duration-500">
      <PageHeader
        variant="split"
        title={t('ReadingHistory')}
        description={t('ReadingHistoryDesc')}
        icon={Icons.History}
        // actions={
        //   <button className="flex items-center gap-2 px-4 py-2 bg-primary border border-transparent rounded-xl text-body font-bold text-white hover:bg-primary-hover transition-all shadow-sm active:scale-95">
        //     <Icons.Export className="h-4 w-4" strokeWidth={2.5} />
        //     {t('ExportExcel')}
        //   </button>
        // }
      >
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center relative">
              <Icons.Property className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="block w-64 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
              >
                <option value="all">{t('AllBuildings')}</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center relative">
              <Icons.Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="block w-44 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>

            <div className="flex items-center relative">
              <Icons.Meter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-44 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
              >
                <option value="all">{t('Status_ALL')}</option>
                <option value="PENDING">{t('Status_PENDING')}</option>
                <option value="SUBMITTED">{t('Status_SUBMITTED')}</option>
              </select>
            </div>

            <div className="relative ml-auto">
              <Icons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
              <input
                type="text"
                placeholder={t('SearchRoom') || 'Tìm mã phòng...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-64 rounded-xl border border-gray-border bg-gray-input py-2 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-surface/30">
        <div className="overflow-hidden rounded-2xl bg-gray-card shadow-sm border border-gray-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body text-gray-muted border-collapse">
              <thead className="bg-gray-surface/50 text-gray-muted font-bold uppercase text-[10px] tracking-wider border-b border-gray-border">
                <tr>
                  <th className="px-6 py-4">{t('RoomCode')}</th>
                  <th className="px-6 py-4">{t('Service')}</th>
                  <th className="px-6 py-4 text-right">{t('ReadingValue')}</th>
                  <th className="px-6 py-4 text-right">{t('UsageValue')}</th>
                  <th className="px-6 py-4 text-center">{t('StatusLabel')}</th>
                  <th className="px-6 py-4 text-center">{t('LastDate')}</th>
                  <th className="px-6 py-4 text-center">{t('Evidence')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icons.Loading className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    </td>
                  </tr>
                ) : filteredReadings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-20 text-center text-gray-muted"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-gray-surface p-4">
                          <Icons.History className="h-8 w-8 text-gray-muted/50" />
                        </div>
                        <p>{t('NoReadingsFound')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReadings.map((r) => (
                    <tr
                      key={r.id}
                      className="group hover:bg-gray-surface transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-text">
                            {r.room_code}
                          </span>
                          <span className="text-tiny text-gray-muted">
                            {r.building_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-muted">
                        <div className="flex items-center gap-2">
                          {r.service_name
                            .toLowerCase()
                            .includes('electricity') ? (
                            <Icons.Energy className="h-4 w-4 text-warning" />
                          ) : (
                            <Icons.Water className="h-4 w-4 text-primary" />
                          )}
                          <span>{r.service_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="font-bold text-gray-text">
                          {r.reading_value !== null
                            ? Number(r.reading_value).toLocaleString()
                            : '-'}
                        </span>
                        <span className="ml-1 text-tiny text-gray-muted italic">
                          {r.service_unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-primary">
                            {r.usage !== null
                              ? `+${Number(r.usage).toLocaleString()}`
                              : '-'}
                          </span>
                          <span className="text-tiny text-gray-muted uppercase">
                            {r.period_month}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-tiny font-bold uppercase ${
                            r.status === 'SUBMITTED' || r.status === 'COMPLETED'
                              ? 'bg-success-light text-success'
                              : r.status === 'PENDING'
                                ? 'bg-gray-subtle text-gray-muted'
                                : 'bg-warning-light text-warning'
                          }`}
                        >
                          {t(`Status_${r.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-gray-muted">
                        {r.reading_date
                          ? new Date(r.reading_date).toLocaleDateString(
                              'vi-VN',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {r.image_url ? (
                          <button className="p-1.5 text-gray-muted hover:text-primary hover:bg-primary-light rounded-lg transition-all">
                            <Icons.Image className="h-5 w-5" />
                          </button>
                        ) : (
                          <span className="text-gray-muted/30">--</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
