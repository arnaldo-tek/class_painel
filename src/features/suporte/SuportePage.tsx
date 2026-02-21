import { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchChamados, updateChamadoStatus } from './api'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'resolvido', label: 'Resolvido' },
]

const statusBadge: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'default' }> = {
  aberto: { label: 'Aberto', variant: 'warning' },
  em_andamento: { label: 'Em andamento', variant: 'info' },
  resolvido: { label: 'Resolvido', variant: 'success' },
}

export function SuporteAlunosPage() {
  return <SuportePage tipo="aluno" titulo="Chamados de Alunos" />
}

export function SuporteProfessoresPage() {
  return <SuportePage tipo="professor" titulo="Chamados de Professores" />
}

function SuportePage({ tipo, titulo }: { tipo: 'aluno' | 'professor'; titulo: string }) {
  const [statusFilter, setStatusFilter] = useState('')
  const qc = useQueryClient()

  const { data: chamados, isLoading } = useQuery({
    queryKey: ['chamados', tipo, statusFilter],
    queryFn: () => fetchChamados(tipo, statusFilter || undefined),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateChamadoStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chamados', tipo] }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>

      <Select
        placeholder="Todos os status"
        options={STATUS_OPTIONS}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : !chamados?.length ? (
        <EmptyState icon={<LifeBuoy className="h-12 w-12" />} title="Nenhum chamado" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-32">Alterar Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chamados.map((c) => {
              const badge = statusBadge[c.status ?? 'aberto'] ?? statusBadge.aberto
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.profiles?.display_name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{c.profiles?.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-sm">{c.descricao ?? '—'}</p>
                  </TableCell>
                  <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                  <TableCell className="text-gray-500">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell>
                    <Select
                      options={STATUS_OPTIONS}
                      value={c.status ?? 'aberto'}
                      onChange={(e) => updateStatus.mutate({ id: c.id, status: e.target.value })}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
