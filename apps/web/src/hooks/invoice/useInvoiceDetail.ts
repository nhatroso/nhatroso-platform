import * as React from 'react';
import { useParams } from 'next/navigation';
import { invoicesService, Invoice } from '@/services/api/invoices';

export function useInvoiceDetail() {
  const params = useParams();
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const [voidReason, setVoidReason] = React.useState('');
  const [showVoidPrompt, setShowVoidPrompt] = React.useState(false);

  const fetchInvoice = React.useCallback(async () => {
    try {
      if (!params?.id) return;
      const id = Number(params.id);
      if (isNaN(id)) return;
      const data = await invoicesService.getInvoice(id);
      setInvoice(data);
    } catch (err) {
      console.error('Failed to fetch invoice', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.id]);

  React.useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePay = async () => {
    if (!invoice) return;
    setIsActionLoading(true);
    try {
      await invoicesService.payInvoice(invoice.id);
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
      await invoicesService.voidInvoice(invoice.id, voidReason);
      setShowVoidPrompt(false);
      await fetchInvoice();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    invoice,
    isLoading,
    isActionLoading,
    voidReason,
    setVoidReason,
    showVoidPrompt,
    setShowVoidPrompt,
    handlePay,
    handleVoid,
    refresh: fetchInvoice,
  };
}
