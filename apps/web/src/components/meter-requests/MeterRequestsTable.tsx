'use client';

import { useMeterRequests } from '@/hooks/meter/useMeterRequests';
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
          <div className="bg-gray-card border border-gray-border rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-border">
              <thead className="bg-gray-surface">
                <tr>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="px-6 py-3">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
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

export default function MeterRequestsTable({
  period,
  searchTerm = '',
}: {
  period?: string;
  searchTerm?: string;
}) {
  const t = useTranslations('MeterRequests.Table');
  const { requests, loading, error } = useMeterRequests(period);

  const filteredRequests = (requests || []).filter((req) =>
    req.room_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-danger-light text-danger rounded-lg border border-danger-light dark:bg-danger-dark/10 dark:border-danger-dark dark:text-danger-dark">
        {error}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-tiny font-medium bg-success-light text-success dark:bg-success-dark/20 dark:text-success-dark">
            <CheckCircle2 className="w-3 h-3" /> {t('StatusValue.SUBMITTED')}
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-tiny font-medium bg-danger-light text-danger dark:bg-danger-dark/20 dark:text-danger-dark">
            <Clock className="w-3 h-3" /> {t('StatusValue.LATE')}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-tiny font-medium bg-warning-light text-warning dark:bg-warning-dark/20 dark:text-warning-dark">
            <Clock className="w-3 h-3" /> {t('StatusValue.PENDING')}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col">
      <div className="-m-1.5 overflow-x-auto">
        <div className="p-1.5 min-w-full inline-block align-middle">
          <div className="bg-gray-card border border-gray-border rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-border">
              <thead className="bg-gray-surface">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-tiny font-bold uppercase tracking-wide text-gray-text">
                      {t('Room')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-tiny font-bold uppercase tracking-wide text-gray-text">
                      {t('Period')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-tiny font-bold uppercase tracking-wide text-gray-text">
                      {t('DueDate')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-tiny font-bold uppercase tracking-wide text-gray-text">
                      {t('Status')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-end whitespace-nowrap"
                  >
                    <span className="text-tiny font-bold uppercase tracking-wide text-gray-text">
                      {t('Action')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-muted"
                    >
                      {t('NoRequests')}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        <span className="text-body font-bold text-gray-text">
                          {req.room_code}
                        </span>
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        <div className="flex items-center gap-x-2">
                          <Calendar className="shrink-0 w-4 h-4 text-gray-muted" />
                          <span className="text-body text-gray-text">
                            {req.period_month}
                          </span>
                        </div>
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        <span className="text-body text-gray-text">
                          {new Date(req.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3 text-end">
                        {req.status === 'SUBMITTED' ? (
                          <button className="inline-flex items-center gap-x-1.5 text-body text-primary decoration-2 hover:underline font-medium dark:text-primary-dark">
                            <ImageIcon className="w-4 h-4" />
                            {t('ViewImages')}
                          </button>
                        ) : (
                          <span className="text-body text-gray-muted italic">
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
