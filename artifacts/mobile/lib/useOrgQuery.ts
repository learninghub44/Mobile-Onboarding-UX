import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useApp } from '@/context/AppContext';

export function useOrgQuery<TData, TError = Error>(
  queryKey: string[],
  queryFn: (orgId: string) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const { currentOrg, orgsError } = useApp();

  return useQuery({
    queryKey: ['org', currentOrg?.id, ...queryKey],
    queryFn: () => {
      if (!currentOrg?.id) {
        throw new Error('No organization selected');
      }
      return queryFn(currentOrg.id);
    },
    enabled: !!currentOrg?.id && !orgsError,
    ...options,
  });
}