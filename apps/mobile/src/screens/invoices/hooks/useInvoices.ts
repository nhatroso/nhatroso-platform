import { useInfiniteQuery } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';

export const useInvoices = (status: string) => {
  const query = useInfiniteQuery({
    queryKey: ['invoices', { status }],
    queryFn: async ({ pageParam = 1 }) => {
      return await invoiceService.getMyInvoices({
        status,
        page: pageParam,
        limit: 10,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has less than the limit (10), there are no more pages
      if (lastPage.length < 10) {
        return undefined;
      }
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const onRefresh = async () => {
    await query.refetch();
  };

  return {
    ...query,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    onRefresh,
    // Flatten the paginated data
    data: query.data?.pages.flat() ?? [],
  };
};
