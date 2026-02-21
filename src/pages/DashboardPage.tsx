import { useAuthContext } from '@/contexts/AuthContext'

export function DashboardPage() {
  const { user, roles, isAdmin, isProfessor } = useAuthContext()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Bem-vindo, {user?.user_metadata?.display_name ?? user?.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Papel" value={roles.join(', ') || '—'} />
        {isAdmin && <DashboardCard title="Tipo" value="Administrador" />}
        {isProfessor && <DashboardCard title="Tipo" value="Professor" />}
        <DashboardCard title="Status" value="Ativo" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">
          Os widgets do dashboard serão implementados nas próximas fases.
        </p>
      </div>
    </div>
  )
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}
