'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Zap,
  Droplets,
  Search,
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  LandlordMeterSummary,
  LandlordMeterDetail,
  Building,
} from '@nhatroso/shared';
import { metersApi } from '@/services/api/meters';
import { getBuildings } from '@/services/api/buildings';
import { getServiceDisplayName, getUnitDisplayName, cn } from '@/lib/utils';

export default function MeterManagementPage() {
  const t = useTranslations('Meters');
  const tServices = useTranslations('Services');

  const [summary, setSummary] = useState<LandlordMeterSummary | null>(null);
  const [meters, setMeters] = useState<LandlordMeterDetail[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'SUBMITTED' | 'OVERDUE'
  >('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryData, buildingsData] = await Promise.all([
          metersApi.getLandlordSummary(selectedPeriod),
          getBuildings(),
        ]);
        setSummary(summaryData);
        setBuildings(buildingsData);

        const metersData = await metersApi.listLandlordMeters(
          selectedBuilding === 'all' ? undefined : selectedBuilding,
          selectedPeriod,
        );
        setMeters(metersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBuilding, selectedPeriod]);

  const filteredMeters = meters.filter((m) => {
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesService =
      serviceFilter === 'all' || m.service_name === serviceFilter;
    const matchesSearch =
      m.room_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesService && matchesSearch;
  });

  const serviceOptions = Array.from(new Set(meters.map((m) => m.service_name)));

  if (loading && !summary) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('Title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('Description')}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('TotalMeters')}
          value={summary?.total_meters || 0}
          icon={<Activity className="text-blue-600" />}
          color="blue"
        />
        <StatsCard
          title={t('PendingReadings')}
          value={summary?.pending_readings || 0}
          icon={<AlertCircle className="text-yellow-600" />}
          color="yellow"
        />
        <StatsCard
          title={t('OverdueReadings')}
          value={summary?.overdue_readings || 0}
          icon={<AlertCircle className="text-red-600" />}
          color="red"
        />
        <StatsCard
          title={t('SubmissionRate')}
          value={`${summary?.submission_rate.toFixed(1)}%`}
          icon={<TrendingUp className="text-emerald-600" />}
          color="emerald"
        />
      </div>

      {/* Filters Area */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('SearchRoom')}:
            </label>
            <input
              type="text"
              className="block w-48 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Period Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('Period') || 'Kỳ'}:
            </label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-48 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            />
          </div>

          {/* Building Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('Building')}:
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="block w-48 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="all">-- {t('AllBuildings')} --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('Service') || 'Dịch vụ'}:
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="block w-40 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="all">-- {t('AllServices')} --</option>
              {serviceOptions.map((svc) => (
                <option key={svc} value={svc}>
                  {getServiceDisplayName(svc, tServices)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('Status')}:
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'PENDING' | 'SUBMITTED' | 'OVERDUE',
                )
              }
              className="block w-40 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="ALL">-- {t('Status_ALL')} --</option>
              <option value="PENDING">{t('Status_PENDING')}</option>
              <option value="SUBMITTED">{t('Status_SUBMITTED')}</option>
              <option value="OVERDUE">{t('Status_OVERDUE')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-700 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4">{t('RoomCode')}</th>
              <th className="px-6 py-4">{t('Building')}</th>
              <th className="px-6 py-4">{t('Service')}</th>
              <th className="px-6 py-4">{t('StatusLabel')}</th>
              <th className="px-6 py-4">{t('LastReading')}</th>
              <th className="px-6 py-4 text-right">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredMeters.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-gray-50 p-4 dark:bg-gray-900">
                      <Search className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-gray-400">{t('NoMetersFound')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMeters.map((m) => (
                <tr
                  key={m.id}
                  className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {m.room_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{m.building_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {m.service_name.toLowerCase().includes('electricity') ? (
                        <Zap className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Droplets className="h-4 w-4 text-blue-500" />
                      )}
                      <span>
                        {getServiceDisplayName(m.service_name, tServices)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={m.status} t={t} />
                  </td>
                  <td className="px-6 py-4">
                    {m.last_reading ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Number(m.last_reading).toLocaleString()}{' '}
                          {getUnitDisplayName(m.service_unit, tServices)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(m.last_reading_date!).toLocaleDateString(
                            'vi-VN',
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300 italic">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-600 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/30"
                        title={t('RecordManually')}
                      >
                        {t('RecordManually')}
                      </button>
                      <button
                        className="rounded-lg bg-gray-50 p-1.5 text-gray-500 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400"
                        title={t('History')}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
      <div className="flex items-center justify-between">
        <div className={cn('inline-flex rounded-xl p-3', colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </h3>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: 'PENDING' | 'SUBMITTED' | 'OVERDUE';
  t: (key: string) => string;
}) {
  const styles: Record<string, string> = {
    PENDING:
      'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-800',
    SUBMITTED:
      'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800',
    OVERDUE:
      'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-inset',
        styles[status] || styles.PENDING,
      )}
    >
      {t(`Status_${status}`)}
    </span>
  );
}
