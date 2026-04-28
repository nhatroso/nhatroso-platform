'use client';

import { useTranslations } from 'next-intl';
import { Card } from 'flowbite-react';
import { Icons } from '@/components/icons';

const kpiData = [
  { key: 'totalProperties', value: '12', icon: Icons.Property, color: 'blue' },
  { key: 'totalRooms', value: '148', icon: Icons.Room, color: 'green' },
  { key: 'activeTenants', value: '124', icon: Icons.Tenant, color: 'cyan' },
  {
    key: 'monthlyRevenue',
    value: '₫186.5M',
    icon: Icons.Revenue,
    color: 'green',
  },
  { key: 'pendingBills', value: '7', icon: Icons.Invoice, color: 'yellow' },
  { key: 'occupancyRate', value: '83.8%', icon: Icons.Chart, color: 'purple' },
] as const;

const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    icon: 'text-blue-600 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-200',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900',
    icon: 'text-green-600 dark:text-green-300',
    text: 'text-green-700 dark:text-green-200',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900',
    icon: 'text-cyan-600 dark:text-cyan-300',
    text: 'text-cyan-700 dark:text-cyan-200',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    icon: 'text-yellow-600 dark:text-yellow-300',
    text: 'text-yellow-700 dark:text-yellow-200',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    icon: 'text-purple-600 dark:text-purple-300',
    text: 'text-purple-700 dark:text-purple-200',
  },
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('title')}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiData.map((kpi) => {
          const colors = colorMap[kpi.color] || colorMap.blue;
          const Icon = kpi.icon;
          return (
            <Card key={kpi.key} className="p-0">
              <div className="flex items-center p-4">
                <div
                  className={`inline-flex shrink-0 items-center justify-center rounded-lg p-3 ${colors.bg}`}
                >
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <div className="ms-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t(kpi.key)}
                  </p>
                  <h3
                    className={`text-2xl font-bold text-gray-900 dark:text-white`}
                  >
                    {kpi.value}
                  </h3>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
