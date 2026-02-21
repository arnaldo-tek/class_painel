import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminPermission } from '@/types/enums'

export function usePermissions(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['permissions', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('permission')
        .eq('user_id', userId)

      if (error) throw error
      return data.map((p) => p.permission)
    },
    enabled: !!userId,
  })

  const hasPermission = (permission: AdminPermission) =>
    query.data?.includes(permission) ?? false

  return { ...query, hasPermission }
}
