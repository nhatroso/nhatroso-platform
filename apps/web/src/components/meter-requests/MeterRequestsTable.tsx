'use client';

import { useMeterRequests } from '@/hooks/use-meter-requests';
import {
  Image as ImageIcon,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/Skeleton';

function TableSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="-m-1.5 overflow-x-auto">
        <div className="p-1.5 min-w-full inline-block align-middle">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="px-6 py-3">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeterRequestsTable({ period }: { period?: string }) {
  const t = useTranslations('MeterRequests.Table');
  const { requests, loading, error } = useMeterRequests(period);

  if (loading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
        {error}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
            <CheckCircle2 className="w-3 h-3" /> {t('StatusValue.SUBMITTED')}
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <Clock className="w-3 h-3" /> {t('StatusValue.LATE')}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3" /> {t('StatusValue.PENDING')}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col">
      <div className="-m-1.5 overflow-x-auto">
        <div className="p-1.5 min-w-full inline-block align-middle">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      {t('Room')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      {t('Period')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      {t('DueDate')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      {t('Status')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-end whitespace-nowrap"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      {t('Action')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {t('NoRequests')}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {req.room_code}
                        </span>
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        <div className="flex items-center gap-x-2">
                          <Calendar className="shrink-0 w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-800 dark:text-gray-200">
                            {req.period_month}
                          </span>
                        </div>
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                          {new Date(req.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3 text-end">
                        {req.status === 'SUBMITTED' ? (
                          <button className="inline-flex items-center gap-x-1.5 text-sm text-blue-600 decoration-2 hover:underline font-medium dark:text-blue-500">
                            <ImageIcon className="w-4 h-4" />
                            {t('ViewImages')}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            {t('Waiting')}
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
    </div>
  );
}
