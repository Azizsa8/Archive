import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { DashboardStats } from '../types/dashboard'

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.stats(),
    refetchInterval: 30_000,
  })
}
