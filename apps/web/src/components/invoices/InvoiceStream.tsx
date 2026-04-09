import { useTranslations } from 'next-intl';
import { Invoice } from '@/services/api/invoices';

interface InvoiceStreamProps {
  invoices: Invoice[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function InvoiceStream({
  invoices,
  selectedId,
  onSelect,
}: InvoiceStreamProps) {
  const t = useTranslations('Invoices');

  if (invoices.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-border">
        <p className="text-body text-gray-muted">{t('noInvoices')}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-success-light text-success border-success-light dark:bg-success-dark/20 dark:text-success-dark dark:border-success-dark';
      case 'UNPAID':
        return 'bg-danger-light text-danger border-danger-light dark:bg-danger-dark/20 dark:text-danger-dark dark:border-danger-dark';
      case 'PENDING_CONFIRMATION':
        return 'bg-warning-light text-warning border-warning-light dark:bg-warning-dark/20 dark:text-warning-dark dark:border-warning-dark';
      case 'VOIDED':
        return 'bg-gray-subtle text-gray-muted border-gray-border';
      default:
        return 'bg-gray-subtle text-gray-muted border-gray-border';
    }
  };

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <button
          key={inv.id}
          onClick={() => onSelect(inv.id)}
          className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
            selectedId === inv.id
              ? 'border-primary bg-primary-light outline-none ring-1 ring-primary'
              : 'border-gray-border bg-gray-card hover:bg-gray-surface'
          }`}
        >
          <div className="flex-1 overflow-hidden pr-4">
            <h3 className="truncate font-semibold text-gray-text">
              {inv.tenant_name || t('unknownTenant')}
            </h3>
            <p className="mt-1 text-body text-gray-muted">
              {t('roomPrefix')}
              {inv.room_code || 'N/A'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="font-bold text-gray-text">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'VND',
              }).format(Number(inv.total_amount))}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-tiny font-medium ${getStatusColor(inv.status)}`}
            >
              {t(`status${inv.status}`)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
