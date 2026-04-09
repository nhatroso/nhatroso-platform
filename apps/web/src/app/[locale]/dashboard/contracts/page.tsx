'use client';

import Link from 'next/link';
import { useContracts } from '@/hooks/use-contracts';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-xl border border-gray-border bg-gray-card p-5 shadow-sm"
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContractsPage() {
  const { contracts, isLoading } = useContracts();

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-gray-border bg-gray-card shadow-sm">
      <PageHeader
        variant="split"
        title="Danh sách Hợp đồng"
        description={`${contracts.length} hợp đồng`}
        actions={
          <Link
            href="/dashboard/contracts/create"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-body font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light dark:focus:ring-primary-hover"
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
        }
      />

      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <GridSkeleton />
        ) : contracts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light dark:bg-gray-subtle">
              <svg
                className="h-8 w-8 text-primary/50"
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
            <h3 className="text-h3 font-medium text-gray-text">
              Chưa có hợp đồng nào
            </h3>
            <p className="mt-2 text-body text-gray-muted">
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
                className="group flex flex-col justify-between rounded-xl border border-gray-border bg-gray-card p-5 transition-all hover:border-primary hover:shadow-md dark:hover:border-primary"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-success-light px-2.5 py-0.5 text-tiny font-medium text-success dark:bg-success-dark/20 dark:text-success-dark">
                      Hiệu lực
                    </span>
                    <span className="text-tiny text-gray-muted">
                      {new Date(contract.created_at).toLocaleDateString(
                        'vi-VN',
                      )}
                      -{' '}
                      {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-body font-semibold text-gray-text line-clamp-1">
                    {contract.tenant_name}
                  </h3>
                  <p className="mt-1 text-body text-gray-muted line-clamp-1">
                    Phòng: {contract.room_code}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-border">
                  <div className="flex items-center justify-between text-tiny">
                    <span className="text-gray-muted">Tiền phòng:</span>
                    <span className="font-medium text-gray-text">
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
