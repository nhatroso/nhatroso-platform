import { useInfiniteQuery } from '@tanstack/react-query';
import { meterService } from '@/services/meter.service';

export const useMetersHistory = (type?: string) => {
  const query = useInfiniteQuery({
    queryKey: ['meters-history', { type }],
    queryFn: async ({ pageParam = 1 }) => {
      return await meterService.getAllMyReadings({
        type,
        page: pageParam,
        limit: 10,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 10) {
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
    data: query.data?.pages.flat() ?? [],
  };
};
