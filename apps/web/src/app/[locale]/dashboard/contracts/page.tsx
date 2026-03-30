'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { contractsService } from '@/services/api/contracts';
import { ContractResponse } from '@nhatroso/shared';

export default function ContractsPage() {
  const t = useTranslations('Sidebar');
  const [contracts, setContracts] = React.useState<ContractResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    contractsService
      .list()
      .then(setContracts)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            {t('contracts')}
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {contracts.length} hợp đồng
          </p>
        </div>
        <Link
          href="/dashboard/contracts/create"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Thêm hợp đồng
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-gray-800">
              <svg
                className="h-8 w-8 text-blue-500/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">
              Chưa có hợp đồng nào
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {' '}
              Bắt đầu bằng cách tạo hợp đồng thuê phòng đầu tiên.{' '}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/dashboard/contracts/${contract.id}`}
                className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Hiệu lực
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(contract.created_at).toLocaleDateString(
                        'vi-VN',
                      )}
                      -{' '}
                      {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                    Người thuê: {contract.tenant_name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    Phòng: {contract.room_code}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Giá thuê:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {contract.monthly_rent.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
