'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import {
  LandlordMeterSummary,
  LandlordMeterDetail,
  Building,
} from '@nhatroso/shared';
import { metersApi } from '@/services/api/meters';
import { getBuildings } from '@/services/api/buildings';
import { getServiceDisplayName, getUnitDisplayName, cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MeterManagementPage() {
  const t = useTranslations('Meters');
  const tServices = useTranslations('Services');

  const [summary, setSummary] = useState<LandlordMeterSummary | null>(null);
  const [meters, setMeters] = useState<LandlordMeterDetail[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [statusFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'OVERDUE'>(
    'ALL',
  );
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
        <Icons.Loading className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        variant="full"
        title={t('Title')}
        description={t('Description')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('TotalMeters')}
          value={summary?.total_meters || 0}
          icon={<Icons.Meter className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          title={t('PendingReadings')}
          value={summary?.pending_readings || 0}
          icon={<Icons.Warning className="h-5 w-5" />}
          color="warning"
        />
        <StatsCard
          title={t('OverdueReadings')}
          value={summary?.overdue_readings || 0}
          icon={<Icons.Warning className="h-5 w-5" />}
          color="danger"
        />
        <StatsCard
          title={t('SubmissionRate')}
          value={`${summary?.submission_rate.toFixed(1)}%`}
          icon={<Icons.Trends className="h-5 w-5" />}
          color="success"
        />
      </div>

      {/* Filters Area */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gray-card p-5 shadow-sm border border-gray-border">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <label className="text-body font-medium text-gray-text">
              {t('SearchRoom')}:
            </label>
            <input
              type="text"
              className="block w-48 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="..."
            />
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <label className="text-body font-medium text-gray-text">
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
          <div className="flex items-center gap-2">
            <label className="text-body font-medium text-gray-text">
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

          {/* Service Filter */}
          <div className="flex items-center gap-2">
            <label className="text-body font-medium text-gray-text">
              {t('Service')}:
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="block w-48 rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">-- {t('AllServices')} --</option>
              {serviceOptions.map((svc) => (
                <option key={svc} value={svc}>
                  {getServiceDisplayName(svc, tServices)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl bg-gray-card shadow-sm border border-gray-border">
        <table className="w-full text-left text-body text-gray-muted">
          <thead className="bg-gray-surface text-tiny uppercase text-gray-muted font-bold tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4 border-b border-gray-border">
                {t('RoomCode')}
              </th>
              <th scope="col" className="px-6 py-4 border-b border-gray-border">
                {t('Building')}
              </th>
              <th scope="col" className="px-6 py-4 border-b border-gray-border">
                {t('Service')}
              </th>
              <th scope="col" className="px-6 py-4 border-b border-gray-border">
                {t('StatusLabel')}
              </th>
              <th scope="col" className="px-6 py-4 border-b border-gray-border">
                {t('LastReading')}
              </th>
              <th
                scope="col"
                className="px-6 py-4 border-b border-gray-border text-right"
              >
                {t('Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border">
            {filteredMeters.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-gray-surface p-4">
                      <Icons.Search className="h-8 w-8 text-gray-muted/50" />
                    </div>
                    <p className="text-gray-muted">{t('NoMetersFound')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMeters.map((m) => (
                <tr
                  key={m.id}
                  className="group transition-colors hover:bg-gray-surface"
                >
                  <td className="px-6 py-4 font-bold text-gray-text">
                    {m.room_code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Icons.Property className="h-4 w-4 text-gray-muted" />
                      <span>{m.building_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {m.service_name.toLowerCase().includes('electricity') ? (
                        <Icons.Energy className="h-4 w-4 text-warning" />
                      ) : (
                        <Icons.Water className="h-4 w-4 text-primary" />
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
                        <span className="font-medium text-gray-text">
                          {Number(m.last_reading).toLocaleString()}{' '}
                          {getUnitDisplayName(m.service_unit, tServices)}
                        </span>
                        {m.last_reading_date && (
                          <span className="text-tiny text-gray-muted">
                            {new Date(m.last_reading_date).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-muted italic opacity-50">
                        --
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                      <button className="rounded-lg bg-primary/10 px-3 py-1.5 text-tiny font-bold text-primary hover:bg-primary/20 transition-colors">
                        {t('RecordManually')}
                      </button>
                      <button className="rounded-lg bg-gray-surface p-1.5 text-gray-muted hover:bg-gray-subtle transition-colors">
                        <Icons.Forward className="h-4 w-4" />
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
  color: 'primary' | 'warning' | 'danger' | 'success';
}) {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
  };

  return (
    <div className="rounded-xl border border-gray-border bg-gray-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={cn('rounded-lg p-3', colorStyles[color])}>{icon}</div>
        <div>
          <p className="text-body font-medium text-gray-muted">{title}</p>
          <h3 className="text-h2 font-bold text-gray-text mt-0.5">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  const styles: Record<string, string> = {
    PENDING: 'bg-warning-light text-warning',
    SUBMITTED: 'bg-success-light text-success',
    OVERDUE: 'bg-danger-light text-danger',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-tiny font-bold ring-1 ring-inset',
        styles[status] || 'bg-gray-subtle text-gray-muted ring-gray-border',
      )}
    >
      {t(`Status_${status}`)}
    </span>
  );
}
