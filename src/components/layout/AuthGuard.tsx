import { Navigate } from '@tanstack/react-router'
import { useAuthContext } from '@/contexts/AuthContext'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isProfessor, roles } = useAuthContext()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // Roles still loading (user exists but roles haven't been fetched yet)
  if (roles.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  // Somente admin, professor e colaborador podem acessar o painel
  const canAccess = isAdmin || isProfessor || roles.includes('colaborador')
  if (!canAccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
        <p className="text-gray-600">
          Você não tem permissão para acessar o painel administrativo.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
