import { useState } from 'react'
import { GraduationCap, CheckCircle, XCircle, Clock, Star } from 'lucide-react'
import { useProfessores, useUpdateProfessorStatus, useProfessorCursos } from './hooks'
import type { ProfessorProfile } from './api'
import type { ApprovalStatus } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
]

const statusBadge: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  em_analise: { label: 'Em análise', variant: 'warning' },
  aprovado: { label: 'Aprovado', variant: 'success' },
  reprovado: { label: 'Reprovado', variant: 'danger' },
}

export function ProfessoresPage() {
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: professores, isLoading } = useProfessores(statusFilter || undefined)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Professores</h1>

      <div className="flex gap-3">
        <Select
          placeholder="Todos os status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | '')}
        />
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : !professores?.length ? (
            <EmptyState
              icon={<GraduationCap className="h-12 w-12" />}
              title="Nenhum professor encontrado"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professores.map((prof) => (
                  <ProfessorRow
                    key={prof.id}
                    professor={prof}
                    isSelected={selectedId === prof.id}
                    onSelect={() => setSelectedId(selectedId === prof.id ? null : prof.id)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {selectedId && (
          <ProfessorDetail professorId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  )
}

function ProfessorRow({
  professor, isSelected, onSelect,
}: { professor: ProfessorProfile; isSelected: boolean; onSelect: () => void }) {
  const updateStatus = useUpdateProfessorStatus()
  const badge = statusBadge[professor.approval_status ?? 'em_analise']

  return (
    <TableRow className={isSelected ? 'bg-blue-50' : ''}>
      <TableCell>
        <button onClick={onSelect} className="text-left">
          <p className="font-medium text-blue-600 hover:underline">{professor.nome_professor}</p>
        </button>
      </TableCell>
      <TableCell>{professor.profiles?.email ?? '—'}</TableCell>
      <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-yellow-500" />
          <span>{professor.average_rating ? Number(professor.average_rating).toFixed(1) : '—'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {professor.approval_status !== 'aprovado' && (
            <button
              onClick={() => updateStatus.mutate({ id: professor.id, status: 'aprovado' })}
              className="rounded p-1.5 text-green-600 hover:bg-green-50"
              title="Aprovar"
            ><CheckCircle className="h-4 w-4" /></button>
          )}
          {professor.approval_status !== 'reprovado' && (
            <button
              onClick={() => updateStatus.mutate({ id: professor.id, status: 'reprovado' })}
              className="rounded p-1.5 text-red-600 hover:bg-red-50"
              title="Reprovar"
            ><XCircle className="h-4 w-4" /></button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function ProfessorDetail({ professorId, onClose }: { professorId: string; onClose: () => void }) {
  const { data: cursos } = useProfessorCursos(professorId)

  return (
    <div className="w-80 shrink-0 rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Cursos do Professor</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XCircle className="h-4 w-4" />
        </button>
      </div>
      {!cursos?.length ? (
        <p className="text-sm text-gray-400">Nenhum curso cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {cursos.map((c) => (
            <div key={c.id} className="rounded border border-gray-100 p-2 text-sm">
              <p className="font-medium text-gray-900">{c.nome}</p>
              <div className="flex items-center gap-2 mt-1 text-gray-500">
                <span>{c.preco ? `R$ ${Number(c.preco).toFixed(2)}` : 'Grátis'}</span>
                <Badge variant={c.is_publicado ? 'success' : 'warning'}>
                  {c.is_publicado ? 'Publicado' : 'Rascunho'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
