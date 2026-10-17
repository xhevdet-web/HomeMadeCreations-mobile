import { apiError } from './apiSlice';

export function useApiResult<T>(query: {
  data?: T;
  error?: unknown;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => unknown;
}) {
  return {
    data: query.data,
    error: query.error ? apiError(query.error).message : '',
    loading: query.isLoading || (query.isFetching && query.data === undefined),
    retry: () => { void query.refetch(); },
  };
}
