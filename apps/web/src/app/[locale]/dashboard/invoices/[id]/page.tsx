'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Invoice,
  getInvoice,
  payInvoice,
  voidInvoice,
} from '@/services/api/invoices';

export default function InvoiceDetailPage() {
  const t = useTranslations('Invoices');
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidPrompt, setShowVoidPrompt] = useState(false);

  const fetchInvoice = React.useCallback(async () => {
    try {
      if (!params?.id) return;
      const id = Number(params.id);
      if (isNaN(id)) return;
      const data = await getInvoice(id);
      setInvoice(data);
    } catch (err) {
      console.error('Failed to fetch invoice', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePay = async () => {
    if (!invoice) return;
    setIsActionLoading(true);
    try {
      await payInvoice(invoice.id);
      await fetchInvoice();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!invoice || voidReason.length < 10) return;
    setIsActionLoading(true);
    try {
      await voidInvoice(invoice.id, voidReason);
      setShowVoidPrompt(false);
      await fetchInvoice();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center animate-in fade-in duration-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/invoices')}
          className="p-2 text-gray-muted hover:text-gray-text hover:bg-gray-surface rounded-lg transition-colors border border-gray-border bg-gray-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader
          variant="full"
          title={t('invoiceDetails')}
          description={`${t('idPrefix')}${invoice.id} • ${t('roomPrefix')}${invoice.room_code}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
            <h3 className="mb-4 text-body font-medium text-gray-muted uppercase tracking-wider">
              {t('breakdown')}
            </h3>
            <div className="rounded-xl border border-gray-border overflow-hidden divide-y divide-gray-border">
              {invoice.details && invoice.details.length > 0 ? (
                invoice.details.map((detail) => (
                  <div
                    key={detail.id}
                    className="flex justify-between p-4 bg-gray-surface/50"
                  >
                    <span className="text-gray-text capitalize">
                      {detail.description}
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(Number(detail.amount))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-gray-muted">{t('noBreakdown')}</div>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-primary-light dark:bg-primary-dark/10 p-6 border border-primary-light dark:border-primary-dark/30">
              <h3 className="font-semibold text-primary dark:text-primary-dark">
                {t('totalAmount')}
              </h3>
              <p className="mt-2 text-h1 font-bold tracking-tight text-primary dark:text-primary-dark">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'VND',
                }).format(Number(invoice.total_amount))}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
            <h3 className="mb-4 text-body font-medium text-gray-muted uppercase tracking-wider">
              {t('paymentHistory')}
            </h3>
            <div className="p-4 space-y-4">
              {invoice.histories && invoice.histories.length > 0 ? (
                invoice.histories.map((history) => (
                  <div
                    key={history.id}
                    className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-primary after:absolute after:bottom-[-20px] after:left-3 after:top-5 after:w-px after:bg-gray-border last:after:hidden"
                  >
                    <p className="text-body font-medium text-gray-text flex items-center gap-2">
                      {history.to_status}
                      {history.reason && (
                        <span className="text-tiny font-normal text-gray-muted bg-gray-subtle px-2 py-0.5 rounded-full">
                          {history.reason}
                        </span>
                      )}
                    </p>
                    <p className="text-tiny text-gray-muted mt-1">
                      {new Date(history.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-body text-gray-muted">{t('noHistory')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
            <h3 className="mb-4 text-body font-medium text-gray-muted uppercase tracking-wider">
              {t('tenantInfo')}
            </h3>
            <div className="rounded-xl border border-gray-border p-4">
              <p className="font-medium text-gray-text">
                {invoice.tenant_name}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-border bg-gray-card p-6 space-y-4 shadow-sm">
            <h3 className="mb-4 text-body font-medium text-gray-muted uppercase tracking-wider">
              Actions
            </h3>
            {showVoidPrompt ? (
              <div className="space-y-3">
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder={t('enterVoidReason')}
                  className="w-full p-3 rounded-lg border border-gray-border bg-gray-input text-body focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleVoid}
                    disabled={voidReason.length < 10 || isActionLoading}
                    className="flex-1 bg-danger text-white font-medium py-2 px-4 rounded-lg hover:bg-danger-hover disabled:opacity-50 transition-colors"
                  >
                    {t('confirmVoid')}
                  </button>
                  <button
                    onClick={() => setShowVoidPrompt(false)}
                    className="px-4 py-2 bg-gray-subtle text-gray-text rounded-lg font-medium transition-colors hover:bg-gray-surface"
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
                    className="w-full bg-success hover:bg-success-hover text-white font-medium py-3 px-4 rounded-xl shadow-sm transition-colors text-center disabled:opacity-50"
                  >
                    {t('markAsPaid')}
                  </button>
                )}
                {isVoidable && (
                  <button
                    onClick={() => setShowVoidPrompt(true)}
                    disabled={isActionLoading}
                    className="w-full bg-gray-card border-2 border-danger-light text-danger hover:bg-danger-light font-medium py-3 px-4 rounded-xl transition-colors text-center disabled:opacity-50"
                  >
                    {t('voidInvoice')}
                  </button>
                )}
                {!isUnpaid && !isVoidable && (
                  <p className="text-gray-muted text-sm text-center">
                    No actions available.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
