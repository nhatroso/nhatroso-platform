'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { InvoiceCreatePanel } from '@/components/invoices/InvoiceCreatePanel';
import { useInvoiceList } from '@/hooks/invoice/useInvoiceList';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import { Invoice } from '@/services/api/invoices';
import { Floor } from '@nhatroso/shared';

export default function InvoicesPage() {
  const t = useTranslations('Invoices');
  const router = useRouter();
  const {
    invoices,
    buildings,
    availableFloors,
    availableRooms,
    availableCycles,
    isLoading,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
    statusFilter,
    cycleFilter,
    searchTerm,
    setSelectedBuildingId,
    setSelectedFloorId,
    setSelectedRoomId,
    setStatusFilter,
    setCycleFilter,
    setSearchTerm,
    handleCreateNew,
    isCreating,
    handleClosePanel,
    handleSuccess,
    handleRemind,
  } = useInvoiceList();

  return (
    <div className="flex h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-2xl border border-gray-border bg-gray-card shadow-sm animate-in fade-in duration-500">
      {/* Header Section */}
      <PageHeader
        variant="split"
        title={t('title')}
        description={t('invoicesFound', { count: invoices.length })}
        icon={Icons.Invoice}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-primary border border-transparent rounded-xl text-body font-bold text-white hover:bg-primary-hover transition-all shadow-sm active:scale-95"
            >
              <Icons.Plus className="h-4 w-4" strokeWidth={2.5} />
              {t('addInvoice', { defaultValue: 'Tạo Hóa đơn' })}
            </button>
          </div>
        }
      >
        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 py-4 border-t border-gray-border/50 mt-4">
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
              {availableFloors.map((f: Floor) => (
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PENDING_CONFIRMATION">Chờ xác nhận</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="VOIDED">Đã hủy</option>
            </select>
          </div>

          {/* Cycle Select */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted group-focus-within:text-primary transition-colors z-10">
              <Icons.History className="h-4 w-4" />
            </div>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm appearance-none"
            >
              <option value="all">Tất cả kỳ</option>
              {availableCycles.map((c) => (
                <option key={c} value={c}>
                  Kỳ {c}
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
              placeholder={t('searchRoomOrTenant')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input py-2.5 pl-9 pr-3 text-[13px] font-medium text-gray-text focus:border-primary focus:ring-primary shadow-sm"
            />
          </div>
        </div>
      </PageHeader>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-surface/30">
        <div className="overflow-hidden rounded-2xl bg-gray-card shadow-sm border border-gray-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body text-gray-muted border-collapse">
              <thead className="bg-gray-surface/50 text-gray-muted font-bold uppercase text-[10px] tracking-wider border-b border-gray-border">
                <tr>
                  <th className="px-6 py-4">{t('tenantInfo')}</th>
                  <th className="px-6 py-4">{t('totalAmount')}</th>
                  <th className="px-6 py-4 text-center">
                    {t('status_label', { defaultValue: 'Status' })}
                  </th>
                  <th className="px-6 py-4 text-center">{t('createdAt')}</th>
                  <th className="px-6 py-4 text-center">{t('dueDate')}</th>
                  <th className="px-6 py-4 text-center">
                    {t('actions', { defaultValue: 'Hành động' })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icons.Loading className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-20 text-center text-gray-muted"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-gray-surface p-4">
                          <Icons.Invoice className="h-8 w-8 text-gray-muted/50" />
                        </div>
                        <p>{t('noInvoices')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: Invoice) => (
                    <tr
                      key={inv.id}
                      className="group hover:bg-gray-surface transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-text group-hover:text-primary transition-colors">
                            {inv.tenant_name || t('unknownTenant')}
                          </span>
                          <span className="text-[12px] text-gray-muted font-medium mt-0.5">
                            {t('roomPrefix')}{' '}
                            <span className="font-bold text-primary dark:text-primary-dark">
                              {inv.room_code || 'N/A'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-text text-body">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(Number(inv.total_amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide',
                            inv.status === 'PAID'
                              ? 'bg-success-light text-success'
                              : inv.status === 'UNPAID'
                                ? 'bg-danger-light text-danger'
                                : inv.status === 'PENDING_CONFIRMATION'
                                  ? 'bg-warning-light text-warning'
                                  : 'bg-gray-subtle text-gray-muted',
                          )}
                        >
                          {t(`status${inv.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-[12px] font-medium">
                        {new Date(inv.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-danger font-bold text-[12px]">
                        {inv.due_date
                          ? new Date(inv.due_date).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {inv.status === 'UNPAID' && (
                            <button
                              onClick={async () => {
                                if (confirm(t('confirmRemind'))) {
                                  const success = await handleRemind(inv.id);
                                  if (success) {
                                    alert(t('remindSent'));
                                  } else {
                                    alert(t('remindFailed'));
                                  }
                                }
                              }}
                              className="inline-flex items-center justify-center p-2 text-warning hover:text-warning-hover hover:bg-warning-light rounded-xl transition-all active:scale-90"
                              title={t('remindTenant')}
                            >
                              <Icons.Bell className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              router.push(`/dashboard/invoices/${inv.id}`)
                            }
                            className="inline-flex items-center justify-center p-2 text-gray-muted hover:text-primary hover:bg-primary-light rounded-xl transition-all active:scale-90"
                            title="View Details"
                          >
                            <Icons.View className="h-5 w-5" />
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
      </div>

      {/* Slide-over Drawer for Invoice Creation */}
      {isCreating && (
        <div
          className="fixed inset-0 z-[100] overflow-hidden"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-gray-strong/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={handleClosePanel}
          />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md animate-in slide-in-from-right duration-300">
              <div className="flex h-full flex-col overflow-y-auto bg-gray-card shadow-2xl border-l border-gray-border">
                <InvoiceCreatePanel
                  onClose={handleClosePanel}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
