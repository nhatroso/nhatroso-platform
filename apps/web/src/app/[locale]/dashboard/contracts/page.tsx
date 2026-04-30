'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { useContractList } from '@/hooks/contract/useContractList';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContractResponse } from '@nhatroso/shared';

interface ExtendedContract extends ContractResponse {
  calculatedStatus: string;
}

type ContractStatusFilter = 'ALL' | 'ACTIVE' | 'ABOUT_TO_EXPIRE' | 'EXPIRED';

function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-gray-border bg-gray-card p-4 shadow-sm"
          >
            <div className="w-[180px]">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="w-[120px] flex justify-center">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="w-[150px]">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="w-[140px] flex justify-end">
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="w-[100px] flex justify-end">
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const t = useTranslations('Contracts');
  const {
    contracts,
    buildings,
    availableFloors,
    availableRooms,
    isLoading,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    statusFilter,
    searchTerm,
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedRoomId,
    setStatusFilter,
    setSearchTerm,
  } = useContractList();

  const tabs: { id: ContractStatusFilter; label: string }[] = [
    { id: 'ACTIVE', label: t('active') },
    { id: 'ABOUT_TO_EXPIRE', label: t('aboutToExpire') },
    { id: 'EXPIRED', label: t('expired') },
    { id: 'ALL', label: t('all') },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full overflow-hidden rounded-2xl border border-gray-border bg-gray-card shadow-sm animate-in fade-in duration-500">
      <PageHeader
        variant="split"
        title={t('title')}
        description={t('contractsFound', { count: contracts.length })}
        icon={Icons.Contract}
        actions={
          <Link
            href="/dashboard/contracts/create"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-body font-bold text-white transition-all hover:bg-primary-hover hover:shadow-md active:scale-95 shadow-sm"
          >
            <Icons.Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
            {t('addContract')}
          </Link>
        }
      >
        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 py-4 border-t border-gray-border/50 mt-4">
          {/* Building Select */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted group-focus-within:text-primary transition-colors z-10">
              <Icons.Property className="h-4 w-4" />
            </div>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
            >
              <option value="all">Tất cả tòa nhà</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Floor Select */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted group-focus-within:text-primary transition-colors z-10">
              <Icons.Floor className="h-4 w-4" />
            </div>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
            >
              <option value="all">Tất cả tầng</option>
              {availableFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  Tầng {f.identifier || f.id}
                </option>
              ))}
            </select>
          </div>

          {/* Room Select */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted group-focus-within:text-primary transition-colors z-10">
              <Icons.Home className="h-4 w-4" />
            </div>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
            >
              <option value="all">Tất cả phòng</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Phòng {r.code}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted group-focus-within:text-primary transition-colors z-10">
              <Icons.History className="h-4 w-4" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ContractStatusFilter)
              }
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative group lg:col-span-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted group-focus-within:text-primary transition-colors z-10">
              <Icons.Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên khách thuê hoặc số phòng"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm"
            />
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto overflow-x-auto p-6 bg-gray-surface/30">
        {isLoading ? (
          <TableSkeleton />
        ) : contracts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-gray-border bg-gray-card/50">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-surface border border-gray-border shadow-inner">
              <Icons.Contract className="h-8 w-8 text-gray-muted/40" />
            </div>
            <h3 className="text-h3 font-bold text-gray-text">
              {searchTerm || statusFilter !== 'ACTIVE'
                ? t('noContractsMatched')
                : t('noContractsYet')}
            </h3>
            <p className="mt-2 text-body text-gray-muted max-w-xs mx-auto">
              {searchTerm || statusFilter !== 'ACTIVE'
                ? t('changeFilter')
                : t('createFirstContract')}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-border bg-gray-card shadow-sm">
            <div className="min-w-[950px] w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-surface/50 text-gray-muted font-bold uppercase text-[10px] tracking-wider border-b border-gray-border">
                  <tr>
                    <th className="px-6 py-4 w-[200px]">{t('tenant')}</th>
                    <th className="px-6 py-4 min-w-[220px]">{t('room')}</th>
                    <th className="px-6 py-4 w-[130px] text-center">
                      {t('status')}
                    </th>
                    <th className="px-6 py-4 min-w-[230px] text-center">
                      {t('duration')}
                    </th>
                    <th className="px-6 py-4 w-[160px] text-right">
                      {t('monthlyRent')}
                    </th>
                    <th className="px-6 py-4 w-[120px] text-right">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-border">
                  {contracts.map((contract: ExtendedContract) => (
                    <tr
                      key={contract.id}
                      className="group hover:bg-gray-surface transition-colors"
                    >
                      <td className="px-6 py-4 w-[200px]">
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-bold text-gray-text truncate group-hover:text-primary transition-colors">
                            {contract.tenant_name}
                          </span>
                          <span className="text-[12px] text-gray-muted font-medium mt-0.5">
                            {contract.tenant_phone || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[250px]">
                        <div className="flex flex-col">
                          <span className="text-body text-gray-text font-bold">
                            Phòng {contract.room_code}
                          </span>
                          <span className="text-[12px] text-gray-muted font-medium mt-0.5 line-clamp-1">
                            {contract.room_address}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-[140px] text-center">
                        {(() => {
                          const s = contract.calculatedStatus;
                          if (s === 'ACTIVE') {
                            return (
                              <span className="inline-flex items-center rounded-full bg-success-light px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-success dark:bg-success-dark/20 dark:text-success-dark">
                                {t('statusActive')}
                              </span>
                            );
                          }
                          if (s === 'ABOUT_TO_EXPIRE') {
                            return (
                              <span className="inline-flex items-center rounded-full bg-danger-light px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-danger dark:bg-danger-dark/20 dark:text-danger-dark">
                                {t('statusAboutToExpire')}
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center rounded-full bg-gray-subtle px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-muted dark:bg-gray-subtle/20 dark:text-gray-muted">
                              {s === 'EXPIRED'
                                ? t('statusExpired')
                                : t('statusTerminated')}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 min-w-[230px] text-center">
                        <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-gray-text">
                          <span className="whitespace-nowrap">
                            {new Date(contract.start_date).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                          <span className="text-[10px] text-gray-muted font-bold uppercase tracking-widest opacity-60">
                            -
                          </span>
                          <span className="whitespace-nowrap">
                            {new Date(contract.end_date).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-[160px] text-right">
                        <span className="font-bold text-gray-text text-body whitespace-nowrap">
                          {contract.monthly_rent.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="px-6 py-4 w-[120px] text-right">
                        <button
                          onClick={() =>
                            (window.location.href = `/dashboard/contracts/${contract.id}`)
                          }
                          className="inline-flex items-center justify-center p-2 text-gray-muted hover:text-primary hover:bg-primary-light rounded-xl transition-all active:scale-90"
                          title={t('details')}
                        >
                          <Icons.View className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
