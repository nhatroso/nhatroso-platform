'use client';

import { useState, useEffect } from 'react';
import {
  getMeterRequests,
  MeterRequest,
} from '@/services/api/meter-automation';
import {
  Loader2,
  Image as ImageIcon,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function MeterRequestsTable() {
  const [requests, setRequests] = useState<MeterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMeterRequests();
        setRequests(data);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to fetch requests';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
        {error}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
            <CheckCircle2 className="w-3 h-3" /> Submitted
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <Clock className="w-3 h-3" /> Late
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3" /> Pending
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      Room ID
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      Period
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      Due Date
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-start whitespace-nowrap"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      Status
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-end whitespace-nowrap"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      Action
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
                      No meter requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td className="h-px w-px whitespace-nowrap px-6 py-3">
                        <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
                          {req.room_id.substring(0, 8)}...
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
                            View Images
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            Waiting...
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
