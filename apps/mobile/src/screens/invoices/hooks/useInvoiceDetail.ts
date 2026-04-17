import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';

export const useInvoiceDetail = (id: number) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoiceDetail(id),
    enabled: !!id,
  });
};
