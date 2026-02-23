import { useQuery } from '@tanstack/react-query'
import { fetchProfessorStats, fetchAdminStats } from './api'

export function useProfessorStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['professor-stats', userId],
    queryFn: () => fetchProfessorStats(userId!),
    enabled: !!userId,
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
  })
}
