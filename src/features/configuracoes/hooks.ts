import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSetting, upsertSetting } from './api'

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['platform-setting', key],
    queryFn: () => fetchSetting(key),
  })
}

export function useUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => upsertSetting(key, value),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['platform-setting', v.key] })
    },
  })
}
