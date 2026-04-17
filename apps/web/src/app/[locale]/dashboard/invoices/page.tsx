'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, Loader2, Receipt, Eye } from 'lucide-react';
import { InvoiceCreatePanel } from '@/components/invoices/InvoiceCreatePanel';
import { useInvoices } from '@/hooks/use-invoices';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';

export default function InvoicesPage() {
  const t = useTranslations('Invoices');
  const router = useRouter();
  const {
    invoices,
    isLoading,
    handleCreateNew,
    isCreating,
    handleClosePanel,
    handleSuccess,
  } = useInvoices();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        inv.room_code?.toLowerCase().includes(term) ||
        inv.tenant_name?.toLowerCase().includes(term);
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-success-light text-success';
      case 'UNPAID':
        return 'bg-danger-light text-danger';
      case 'PENDING_CONFIRMATION':
        return 'bg-warning-light text-warning';
      case 'VOIDED':
        return 'bg-gray-subtle text-gray-muted';
      default:
        return 'bg-gray-subtle text-gray-muted';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <PageHeader
        variant="full"
        title={t('title')}
        description={t('invoicesFound', { count: filteredInvoices.length })}
        actions={
          <div className="flex items-center gap-3">
            {/* <button className="flex items-center gap-2 px-4 py-2 bg-gray-card border border-gray-border rounded-xl text-body font-medium hover:bg-gray-surface transition-colors shadow-sm text-gray-text">
              <Download className="h-4 w-4" />
              Export Excel
            </button> */}
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-primary border border-transparent rounded-xl text-body font-medium text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              + Create Invoice
            </button>
          </div>
        }
      />

      {/* Filters Section */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gray-card p-5 shadow-sm border border-gray-border sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
            <input
              type="text"
              placeholder={t('searchRoomOrTenant')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 rounded-lg border border-gray-border bg-gray-input py-2.5 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="flex items-center relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block appearance-none w-52 rounded-lg border border-gray-border bg-gray-input py-2.5 pl-9 pr-4 text-body text-gray-text focus:border-primary focus:ring-primary"
            >
              <option value="all">{t('status_all')}</option>
              <option value="UNPAID">{t('statusUNPAID')}</option>
              <option value="PENDING_CONFIRMATION">
                {t('statusPENDING_CONFIRMATION')}
              </option>
              <option value="PAID">{t('statusPAID')}</option>
              <option value="VOIDED">{t('statusVOIDED')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl bg-gray-card shadow-sm border border-gray-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body text-gray-muted">
            <thead className="bg-gray-surface text-gray-muted font-bold uppercase text-[10px] tracking-wider border-b border-gray-border">
              <tr>
                <th className="px-6 py-4">{t('tenantInfo')}</th>
                <th className="px-6 py-4">{t('totalAmount')}</th>
                <th className="px-6 py-4 text-center">
                  {t('status_label', { defaultValue: 'Status' })}
                </th>
                <th className="px-6 py-4 text-center">{t('createdAt')}</th>
                <th className="px-6 py-4 text-center">{t('dueDate')}</th>
                <th className="px-6 py-4 text-center">
                  {t('details', { defaultValue: 'Details' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-muted">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-gray-surface p-4">
                        <Receipt className="h-8 w-8 text-gray-muted/50" />
                      </div>
                      <p>{t('noInvoices')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="group hover:bg-gray-surface transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-text">
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
                        className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(inv.status)}`}
                      >
                        {t(`status${inv.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-danger font-medium">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/invoices/${inv.id}`)
                        }
                        className="inline-flex items-center justify-center p-2 text-gray-muted hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
