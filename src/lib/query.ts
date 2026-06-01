import { QueryClient, useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Default live-refresh interval for dashboards/monitoring (A6). */
export const POLL_INTERVAL_MS = 30_000

/**
 * usePolledQuery — a normal query that auto-refetches on an interval.
 * Centralised so the 30s monitoring refresh can later be swapped to websockets
 * by changing only this hook.
 */
export function usePolledQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError, TData, QueryKey> & { intervalMs?: number },
) {
  const { intervalMs = POLL_INTERVAL_MS, ...rest } = options
  return useQuery<TData, TError, TData, QueryKey>({
    ...rest,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
  })
}
