import { useState } from 'react'
import { Users, Search, Ban, CheckCircle, BookOpen } from 'lucide-react'
import { useAlunos, useAlunoEnrollments, useToggleAlunoSuspended } from './hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'

export function AlunosPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useAlunos(search || undefined, page)
  const toggleSuspend = useToggleAlunoSuspended()

  function handleSearch() {
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button variant="secondary" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : !data?.alunos.length ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Nenhum aluno encontrado"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.alunos.map((aluno) => (
                    <TableRow key={aluno.id} className={selectedId === aluno.id ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <button
                          onClick={() => setSelectedId(selectedId === aluno.id ? null : aluno.id)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {aluno.display_name ?? 'Sem nome'}
                        </button>
                      </TableCell>
                      <TableCell>{aluno.email}</TableCell>
                      <TableCell>{aluno.cpf ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={aluno.is_suspended ? 'danger' : 'success'}>
                          {aluno.is_suspended ? 'Suspenso' : 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleSuspend.mutate({
                            userId: aluno.id,
                            isSuspended: !aluno.is_suspended,
                          })}
                          className={`rounded p-1.5 ${aluno.is_suspended
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={aluno.is_suspended ? 'Reativar' : 'Suspender'}
                        >
                          {aluno.is_suspended
                            ? <CheckCircle className="h-4 w-4" />
                            : <Ban className="h-4 w-4" />
                          }
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>

        {selectedId && (
          <AlunoEnrollmentsPanel userId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  )
}

function AlunoEnrollmentsPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: enrollments, isLoading } = useAlunoEnrollments(userId)

  return (
    <div className="w-80 shrink-0 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Matrículas</h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">Fechar</button>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : !enrollments?.length ? (
        <p className="text-sm text-gray-400">Nenhuma matrícula encontrada.</p>
      ) : (
        <div className="space-y-2">
          {enrollments.map((e) => (
            <div key={e.id} className="rounded border border-gray-100 p-2 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-gray-900">{e.cursos?.nome ?? e.curso_id}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('pt-BR') : '—'}
                </span>
                {e.is_suspended && <Badge variant="danger">Suspenso</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
