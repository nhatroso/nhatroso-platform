'use client';

import { useTranslations } from 'next-intl';

const kpiData = [
  { key: 'totalProperties', value: '12', icon: 'building', color: 'blue' },
  { key: 'totalRooms', value: '148', icon: 'door', color: 'green' },
  { key: 'activeTenants', value: '124', icon: 'users', color: 'teal' },
  { key: 'monthlyRevenue', value: '₫186.5M', icon: 'money', color: 'emerald' },
  { key: 'pendingBills', value: '7', icon: 'invoice', color: 'yellow' },
  { key: 'occupancyRate', value: '83.8%', icon: 'chart', color: 'cyan' },
] as const;

function KpiIcon({ type }: { type: string }) {
  const cls = 'h-7 w-7';
  switch (type) {
    case 'building':
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'door':
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm4 0v12h6V4H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'users':
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      );
    case 'money':
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'invoice':
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'chart':
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
      );
    default:
      return null;
  }
}

const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
  blue: {
    bg: 'bg-primary-light dark:bg-primary-dark/10',
    icon: 'text-primary dark:text-primary-dark',
    text: 'text-primary dark:text-primary-dark',
  },
  green: {
    bg: 'bg-success-light dark:bg-success-dark/10',
    icon: 'text-success dark:text-success-dark',
    text: 'text-success dark:text-success-dark',
  },
  teal: {
    bg: 'bg-success-light dark:bg-success-dark/10',
    icon: 'text-success dark:text-success-dark',
    text: 'text-success dark:text-success-dark',
  },
  emerald: {
    bg: 'bg-success-light dark:bg-success-dark/10',
    icon: 'text-success dark:text-success-dark',
    text: 'text-success dark:text-success-dark',
  },
  yellow: {
    bg: 'bg-warning-light dark:bg-warning-dark/10',
    icon: 'text-warning dark:text-warning-dark',
    text: 'text-warning dark:text-warning-dark',
  },
  cyan: {
    bg: 'bg-primary-light dark:bg-primary-dark/10',
    icon: 'text-primary dark:text-primary-dark',
    text: 'text-primary dark:text-primary-dark',
  },
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold text-gray-text">{t('title')}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiData.map((kpi) => {
          const colors = colorMap[kpi.color];
          return (
            <div
              key={kpi.key}
              className="rounded-lg border border-gray-border bg-gray-card p-5 shadow-sm"
            >
              <div className="flex items-center">
                <div
                  className={`inline-flex shrink-0 items-center justify-center rounded-lg p-3 ${colors.bg}`}
                >
                  <span className={colors.icon}>
                    <KpiIcon type={kpi.icon} />
                  </span>
                </div>
                <div className="ms-4">
                  <p className="text-body font-medium text-gray-muted">
                    {t(kpi.key)}
                  </p>
                  <h3 className={`text-h1 font-bold ${colors.text}`}>
                    {kpi.value}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
