'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  History,
  Zap,
  Image as ImageIcon,
  Download,
  Loader2,
  Droplets,
} from 'lucide-react';
import { Building } from '@nhatroso/shared';
import { metersApi, LandlordMeterReadingDetail } from '@/services/api/meters';
import { getBuildings } from '@/services/api/buildings';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MeterReadingsPage() {
  const t = useTranslations('Meters');
  const [readings, setReadings] = useState<LandlordMeterReadingDetail[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7), // YYYY-MM
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const data = await getBuildings();
        setBuildings(data);
      } catch (error) {
        console.error('Error fetching buildings:', error);
      }
    };
    fetchBuildings();
  }, []);

  useEffect(() => {
    const fetchReadings = async () => {
      setLoading(true);
      try {
        const data = await metersApi.listLandlordReadings({
          buildingId: selectedBuilding === 'all' ? undefined : selectedBuilding,
          periodMonth: selectedPeriod,
        });
        setReadings(data);
      } catch (error) {
        console.error('Error fetching readings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReadings();
  }, [selectedBuilding, selectedPeriod]);

  const filteredReadings = readings.filter((r) => {
    const matchesSearch =
      r.room_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.building_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <PageHeader
        variant="full"
        title={t('ReadingHistory')}
        description={t('ReadingHistoryDesc')}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-card border border-gray-border rounded-xl text-body font-medium hover:bg-gray-surface transition-colors shadow-sm text-gray-text">
            <Download className="h-4 w-4" />
            {t('ExportExcel')}
          </button>
        }
      />

      {/* Filters Section */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gray-card p-5 shadow-sm border border-gray-border sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex items-center">
            <label className="mr-2 text-body font-medium text-gray-text">
              {t('SearchRoom')}:
            </label>
            <input
              type="text"
              value={searchTerm}
              placeholder="A101"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-40 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            />
          </div>

          {/* Period Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-body font-medium text-gray-text">
              {t('Period')}:
            </label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-48 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            />
          </div>

          {/* Building Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-body font-medium text-gray-text">
              {t('Building')}:
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="block w-48 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">-- {t('AllBuildings')} --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-body font-medium text-gray-text">
              {t('Status')}:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-50 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">-- {t('Status_ALL')} --</option>
              <option value="PENDING">{t('Status_PENDING')}</option>
              <option value="SUBMITTED">{t('Status_SUBMITTED')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Readings Table */}
      <div className="overflow-hidden rounded-2xl bg-gray-card shadow-sm border border-gray-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body text-gray-muted">
            <thead className="bg-gray-surface text-gray-muted font-bold uppercase text-tiny tracking-wider">
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
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </td>
                </tr>
              ) : filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-muted">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-gray-surface p-4">
                        <History className="h-8 w-8 text-gray-muted/50" />
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
                          <Zap className="h-4 w-4 text-warning" />
                        ) : (
                          <Droplets className="h-4 w-4 text-primary" />
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
                          r.status === 'SUBMITTED'
                            ? 'bg-success-light text-success'
                            : 'bg-warning-light text-warning'
                        }`}
                      >
                        {t(`Status_${r.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {r.reading_date
                        ? new Date(r.reading_date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.image_url ? (
                        <button
                          className="p-1.5 text-gray-muted hover:text-primary hover:bg-primary-light rounded-lg transition-all"
                          title="Xem ảnh"
                        >
                          <ImageIcon className="h-5 w-5" />
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
  );
}
