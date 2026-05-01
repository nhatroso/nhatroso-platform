'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { useInvoiceDetail } from '@/hooks/invoice/useInvoiceDetail';

export default function InvoiceDetailPage() {
  const t = useTranslations('Invoices');
  const router = useRouter();

  const {
    invoice,
    isLoading,
    isActionLoading,
    voidReason,
    setVoidReason,
    showVoidPrompt,
    setShowVoidPrompt,
    handlePay,
    handleVoid,
  } = useInvoiceDetail();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center animate-in fade-in duration-500">
        <Icons.Loading className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center text-gray-text animate-in fade-in duration-500">
        Invoice not found.
      </div>
    );
  }

  const isUnpaid =
    invoice.status === 'UNPAID' || invoice.status === 'PENDING_CONFIRMATION';
  const isVoidable = invoice.status !== 'VOIDED';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumb Section */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-tiny font-medium text-gray-muted hover:text-primary transition-colors"
            >
              <Icons.Home className="mr-2.5 h-3 w-3" />
              {t('dashboard')}
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <Icons.Next className="h-4 w-4 text-gray-border" />
              <Link
                href="/dashboard/invoices"
                className="ml-1 text-tiny font-medium text-gray-muted hover:text-primary md:ml-2 transition-colors"
              >
                {t('title')}
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <Icons.Next className="h-4 w-4 text-gray-border" />
              <span className="ml-1 text-tiny font-bold text-gray-text md:ml-2">
                #{invoice.id}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-border mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/invoices')}
            className="p-2 text-gray-muted hover:text-gray-text hover:bg-gray-surface rounded-lg transition-colors border border-gray-border bg-gray-card shadow-sm"
          >
            <Icons.Back className="h-5 w-5" />
          </button>
          <PageHeader
            variant="full"
            title={t('invoiceDetails')}
            description={`${t('idPrefix')}${invoice.id} • ${t('roomPrefix')}${invoice.room_code}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Breakdown Card */}
          <div className="rounded-2xl border border-gray-border bg-gray-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-border bg-gray-surface/30 flex items-center gap-2">
              <Icons.Contract className="h-5 w-5 text-primary" />
              <h3 className="text-body font-bold text-gray-text uppercase tracking-wider">
                {t('breakdown')}
              </h3>
            </div>
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-body text-gray-text">
                <thead className="text-[11px] text-gray-muted uppercase bg-gray-surface/50 font-bold border-b border-gray-border">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      {t('description_label')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      {t('amount_label')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-border">
                  {invoice.details && invoice.details.length > 0 ? (
                    invoice.details.map((detail) => (
                      <tr
                        key={detail.id}
                        className="bg-white hover:bg-gray-surface/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-text capitalize">
                          {detail.description}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-strong">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(Number(detail.amount))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-8 text-center text-gray-muted italic"
                      >
                        {t('noBreakdown')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History Timeline Card */}
          <div className="rounded-2xl border border-gray-border bg-gray-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-border bg-gray-surface/30 flex items-center gap-2">
              <Icons.History className="h-5 w-5 text-primary" />
              <h3 className="text-body font-bold text-gray-text uppercase tracking-wider">
                {t('paymentHistory')}
              </h3>
            </div>
            <div className="p-8">
              <ol className="relative border-l border-gray-border ml-3">
                {invoice.histories && invoice.histories.length > 0 ? (
                  invoice.histories.map((history, idx) => (
                    <li
                      key={history.id}
                      className={`${idx !== invoice.histories!.length - 1 ? 'mb-10' : ''} ml-6`}
                    >
                      <span className="absolute flex items-center justify-center w-6 h-6 bg-primary-light rounded-full -left-3 ring-8 ring-white">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                      </span>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="flex items-center text-body font-bold text-gray-text uppercase">
                          {history.to_status}
                        </h3>
                        {idx === 0 && (
                          <span className="bg-primary-light text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-primary-subtle">
                            {t('latest')}
                          </span>
                        )}
                      </div>
                      <time className="block mb-2 text-[11px] font-medium leading-none text-gray-muted uppercase tracking-tight">
                        {new Date(history.timestamp).toLocaleString('vi-VN')}
                      </time>
                      {history.reason && (
                        <p className="text-body font-normal text-gray-muted bg-gray-surface p-3 rounded-xl border border-gray-border mt-2">
                          <span className="font-bold text-gray-text mr-1">
                            {t('reason_label')}:
                          </span>{' '}
                          {history.reason}
                        </p>
                      )}
                    </li>
                  ))
                ) : (
                  <p className="text-body text-gray-muted text-center py-4">
                    {t('noHistory')}
                  </p>
                )}
              </ol>
            </div>
          </div>
        </div>

        {/* Sidebar Actions Area */}
        <div className="space-y-6">
          {/* Total Amount Card (Pinned/Highlighted) */}
          <div className="rounded-2xl bg-primary text-white p-6 shadow-xl border border-primary-hover relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <Icons.Revenue className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  {t('totalAmount')}
                </span>
              </div>
              <p className="text-h1 font-black tracking-tight leading-none">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'VND',
                }).format(Number(invoice.total_amount))}
              </p>
            </div>
          </div>

          {/* Tenant Info Card */}
          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-muted">
              <Icons.Tenant className="h-4 w-4" />
              <h3 className="text-tiny font-bold uppercase tracking-wider">
                {t('tenantInfo')}
              </h3>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-surface border border-gray-border">
              <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                {invoice.tenant_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold text-gray-text leading-tight">
                  {invoice.tenant_name}
                </p>
                <p className="text-[11px] text-gray-muted font-medium mt-1">
                  {t('tenant')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-gray-muted">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h3 className="text-tiny font-bold uppercase tracking-wider">
                {t('availableActions')}
              </h3>
            </div>
            {showVoidPrompt ? (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-gray-muted uppercase ml-1">
                    {t('voidReason_label')}
                  </label>
                  <textarea
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder={t('enterVoidReason')}
                    className="w-full p-4 rounded-xl border border-gray-border bg-gray-input text-body focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleVoid}
                    disabled={voidReason.length < 10 || isActionLoading}
                    className="w-full bg-danger text-white font-bold py-3.5 px-4 rounded-xl hover:bg-danger-hover disabled:opacity-50 transition-all shadow-lg shadow-danger/20 hover:shadow-danger/40 active:scale-[0.98]"
                  >
                    {isActionLoading ? (
                      <Icons.Loading className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      t('confirmVoid')
                    )}
                  </button>
                  <button
                    onClick={() => setShowVoidPrompt(false)}
                    className="w-full py-3.5 bg-gray-subtle text-gray-text rounded-xl font-bold transition-all hover:bg-gray-surface border border-gray-border active:scale-[0.98]"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {isUnpaid && (
                  <button
                    onClick={handlePay}
                    disabled={isActionLoading}
                    className="w-full bg-success hover:bg-success-hover text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-success/20 hover:shadow-success-hover/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isActionLoading ? (
                      <Icons.Loading className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Icons.Revenue className="h-5 w-5" />
                        {t('markAsPaid')}
                      </>
                    )}
                  </button>
                )}
                {isVoidable && (
                  <button
                    onClick={() => setShowVoidPrompt(true)}
                    disabled={isActionLoading}
                    className="w-full bg-white border-2 border-danger text-danger hover:bg-danger/5 font-bold py-4 px-4 rounded-xl transition-all text-center active:scale-[0.98] disabled:opacity-50"
                  >
                    {t('voidInvoice')}
                  </button>
                )}
                {!isUnpaid && !isVoidable && (
                  <div className="bg-gray-surface border border-gray-border rounded-xl p-6 text-center">
                    <Icons.History className="h-8 w-8 text-gray-muted/30 mx-auto mb-2" />
                    <p className="text-tiny font-bold text-gray-muted uppercase tracking-wider">
                      {t('noActionsAvailable')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
