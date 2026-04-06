'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  History,
  Search,
  Building2,
  Calendar,
  Zap,
  Image as ImageIcon,
  Download,
  Loader2,
  Droplets,
} from 'lucide-react';
import { Building } from '@nhatroso/shared';
import { metersApi, LandlordMeterReadingDetail } from '@/services/api/meters';
import { getBuildings } from '@/services/api/buildings';

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            {t('ReadingHistory')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('ReadingHistoryDesc')}
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-gray-700 dark:text-gray-300">
          <Download className="h-4 w-4" />
          {t('ExportExcel')}
        </button>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 sm:flex-row sm:items-center">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
          {/* Building Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 dark:text-white"
            >
              <option value="all">{t('AllBuildings')}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <History className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 dark:text-white"
            >
              <option value="all">{t('Status_ALL')}</option>
              <option value="PENDING">{t('Status_PENDING')}</option>
              <option value="SUBMITTED">{t('Status_SUBMITTED')}</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('SearchRoom')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Readings Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  </td>
                </tr>
              ) : filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-gray-50 p-4 dark:bg-gray-900">
                        <History className="h-8 w-8 text-gray-300" />
                      </div>
                      <p>{t('NoReadingsFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReadings.map((r) => (
                  <tr
                    key={r.id}
                    className="group hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {r.room_code}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {r.building_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {r.service_name.toLowerCase().includes('electricity') ? (
                          <Zap className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Droplets className="h-4 w-4 text-blue-500" />
                        )}
                        <span>{r.service_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {r.reading_value !== null
                          ? Number(r.reading_value).toLocaleString()
                          : '-'}
                      </span>
                      <span className="ml-1 text-xs text-gray-400 italic">
                        {r.service_unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {r.usage !== null
                            ? `+${Number(r.usage).toLocaleString()}`
                            : '-'}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">
                          {r.period_month}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'SUBMITTED'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
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
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="Xem ảnh"
                        >
                          <ImageIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">
                          --
                        </span>
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
