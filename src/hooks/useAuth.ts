import { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/enums'

interface AuthState {
  user: User | null
  session: Session | null
  roles: UserRole[]
  isLoading: boolean
  isAdmin: boolean
  isProfessor: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    isLoading: true,
    isAdmin: false,
    isProfessor: false,
  })

  const fetchAndSetRoles = useCallback(async (user: User, session: Session) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const roles = (data ?? []).map((r) => r.role) as UserRole[]
    setState({
      user,
      session,
      roles,
      isLoading: false,
      isAdmin: roles.includes('admin'),
      isProfessor: roles.includes('professor'),
    })
  }, [])

  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAndSetRoles(session.user, session)
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    })

    // 2. Listen for auth changes
    // IMPORTANT: keep this callback synchronous — awaiting supabase queries
    // inside onAuthStateChange causes a deadlock with the auth internal lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Set user + isLoading:false immediately so UI unblocks
          setState((prev) => ({
            ...prev,
            user: session.user,
            session,
            isLoading: false,
          }))
          // Fetch roles outside the auth lock
          setTimeout(() => fetchAndSetRoles(session.user, session), 0)
        } else {
          setState({
            user: null,
            session: null,
            roles: [],
            isLoading: false,
            isAdmin: false,
            isProfessor: false,
          })
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [fetchAndSetRoles])

  return state
}
