import { useAuthContext } from '@/contexts/AuthContext'
import { useProfessorStats } from '@/features/dashboard/hooks'
import { useAdminStats } from '@/features/dashboard/hooks'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  BookOpen, Users, TrendingUp, Star, GraduationCap,
} from 'lucide-react'

function useProfileName(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-name', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()
      return data?.display_name ?? null
    },
    enabled: !!userId,
  })
}

export function DashboardPage() {
  const { user, isAdmin, isProfessor } = useAuthContext()
  const { data: profileName } = useProfileName(user?.id)

  const displayName = profileName || user?.user_metadata?.display_name || user?.email

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Bem-vindo(a), {displayName}
        </p>
      </div>

      {isProfessor && !isAdmin ? (
        <ProfessorDashboard userId={user?.id} />
      ) : (
        <AdminDashboard />
      )}
    </div>
  )
}

function ProfessorDashboard({ userId }: { userId: string | undefined }) {
  const { data: stats, isLoading } = useProfessorStats(userId)

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Meus Cursos"
        value={String(stats?.totalCursos ?? 0)}
        icon={BookOpen}
        color="blue"
      />
      <KpiCard
        title="Alunos Matriculados"
        value={String(stats?.totalAlunos ?? 0)}
        icon={Users}
        color="purple"
      />
      <KpiCard
        title="Minha Receita"
        value={formatCurrency(stats?.receitaTotal ?? 0)}
        icon={TrendingUp}
        color="green"
      />
      <KpiCard
        title="Avaliação Média"
        value={stats?.avaliacaoMedia != null ? stats.avaliacaoMedia.toFixed(1) : '—'}
        icon={Star}
        color="orange"
      />
    </div>
  )
}

function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total Cursos"
        value={String(stats?.totalCursos ?? 0)}
        icon={BookOpen}
        color="blue"
      />
      <KpiCard
        title="Total Professores"
        value={String(stats?.totalProfessores ?? 0)}
        icon={GraduationCap}
        color="purple"
      />
      <KpiCard
        title="Total Alunos"
        value={String(stats?.totalAlunos ?? 0)}
        icon={Users}
        color="orange"
      />
      <KpiCard
        title="Receita Total"
        value={formatCurrency(stats?.receitaTotal ?? 0)}
        icon={TrendingUp}
        color="green"
      />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type CardColor = 'blue' | 'green' | 'purple' | 'orange'

const cardColors: Record<CardColor, string> = {
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 border-blue-200 shadow-sm',
  green: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-200 shadow-sm',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-600 border-purple-200 shadow-sm',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-600 border-orange-200 shadow-sm',
}

const iconColors: Record<CardColor, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
}

function KpiCard({
  title, value, icon: Icon, color,
}: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: CardColor
}) {
  return (
    <div className={`rounded-lg border p-4 ${cardColors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${iconColors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
      ))}
    </div>
  )
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
