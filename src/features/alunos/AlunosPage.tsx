import { useState } from 'react'
import { Users, Search, Ban, CheckCircle, BookOpen, Mail, Phone, CreditCard, Calendar } from 'lucide-react'
import { useAlunos, useAlunoEnrollments, useToggleAlunoSuspended } from './hooks'
import type { Aluno } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { Drawer } from '@/components/ui/drawer'

export function AlunosPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)

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
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell>
                    <button
                      onClick={() => setSelectedAluno(aluno)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {aluno.display_name ?? 'Sem nome'}
                    </button>
                  </TableCell>
                  <TableCell>{aluno.email}</TableCell>
                  <TableCell>{aluno.cpf ?? '—'}</TableCell>
                  <TableCell>
                    {aluno.created_at ? new Date(aluno.created_at).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
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

      <Drawer
        open={!!selectedAluno}
        onClose={() => setSelectedAluno(null)}
        title={selectedAluno?.display_name ?? 'Detalhe do Aluno'}
      >
        {selectedAluno && <AlunoDetail aluno={selectedAluno} />}
      </Drawer>
    </div>
  )
}

function AlunoDetail({ aluno }: { aluno: Aluno }) {
  const { data: enrollments, isLoading } = useAlunoEnrollments(aluno.id)
  const toggleSuspend = useToggleAlunoSuspended()

  return (
    <div className="space-y-6">
      {/* Info do aluno */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
            {(aluno.display_name ?? 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{aluno.display_name ?? 'Sem nome'}</p>
            <Badge variant={aluno.is_suspended ? 'danger' : 'success'}>
              {aluno.is_suspended ? 'Suspenso' : 'Ativo'}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{aluno.email}</span>
          </div>
          {aluno.phone_number && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{aluno.phone_number}</span>
            </div>
          )}
          {aluno.cpf && (
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span>{aluno.cpf}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>Cadastro: {aluno.created_at ? new Date(aluno.created_at).toLocaleDateString('pt-BR') : '—'}</span>
          </div>
        </div>

        <Button
          variant={aluno.is_suspended ? 'secondary' : 'danger'}
          className="w-full"
          onClick={() => toggleSuspend.mutate({
            userId: aluno.id,
            isSuspended: !aluno.is_suspended,
          })}
        >
          {aluno.is_suspended ? (
            <><CheckCircle className="mr-2 h-4 w-4" /> Reativar Aluno</>
          ) : (
            <><Ban className="mr-2 h-4 w-4" /> Suspender Aluno</>
          )}
        </Button>
      </div>

      {/* Matrículas */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Matrículas
        </h3>
        {isLoading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : !enrollments?.length ? (
          <p className="text-sm text-gray-400">Nenhuma matrícula encontrada.</p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((e) => (
              <div key={e.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">{e.cursos?.nome ?? e.curso_id}</span>
                  {e.is_suspended && <Badge variant="danger">Suspenso</Badge>}
                </div>
                <span className="text-xs text-gray-500">
                  Matriculado em {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
