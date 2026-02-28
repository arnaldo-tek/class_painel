import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
}

export function createSupabaseFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authHeader ?? '' } },
    },
  )
}

/** Check if user has a specific role */
export async function hasRole(
  supabase: ReturnType<typeof createSupabaseFromRequest>,
  userId: string,
  role: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle()
  return !!data
}

/** Check if user is admin or professor */
export async function isAdminOrProfessor(
  supabase: ReturnType<typeof createSupabaseFromRequest>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'professor'])
    .limit(1)
  return (data?.length ?? 0) > 0
}

/** Check if user owns a professor profile (is that professor or is admin) */
export async function canAccessProfessorData(
  supabase: ReturnType<typeof createSupabaseFromRequest>,
  userId: string,
  professorProfileId: string,
): Promise<boolean> {
  // Check admin
  const admin = await hasRole(supabase, userId, 'admin')
  if (admin) return true

  // Check if the user IS this professor
  const { data } = await supabase
    .from('professor_profiles')
    .select('id')
    .eq('id', professorProfileId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
