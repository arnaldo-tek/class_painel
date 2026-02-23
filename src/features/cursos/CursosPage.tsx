import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, Plus, BookOpen, Eye, Pencil, Globe, XCircle } from 'lucide-react'
import { useCursos, useProfessores, useCategoriasCurso, useEncerrarCurso, useTogglePublicarCurso } from './hooks'
import type { CursosFilters, Curso } from './api'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfessorProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'

function getCursoStatus(curso: Curso) {
  if (curso.is_encerrado) return { label: 'Encerrado', variant: 'danger' as const }
  if (curso.is_publicado) return { label: 'Publicado', variant: 'success' as const }
  return { label: 'Rascunho', variant: 'warning' as const }
}

export function CursosPage() {
  const { isAdmin, isProfessor, user } = useAuthContext()
  const { data: professorProfile } = useProfessorProfile(isProfessor ? user?.id : undefined)
  const [filters, setFilters] = useState<CursosFilters>({ page: 1 })
  const [searchInput, setSearchInput] = useState('')

  // Professor só vê seus próprios cursos (usa professor_profiles.id, não user.id)
  const effectiveFilters: CursosFilters = {
    ...filters,
    ...(isProfessor && !isAdmin ? { professorId: professorProfile?.id } : {}),
  }

  const { data, isLoading, error } = useCursos(effectiveFilters)
  const { data: professores } = useProfessores()
  const { data: categorias } = useCategoriasCurso()
  const encerrarMutation = useEncerrarCurso()
  const togglePublicarMutation = useTogglePublicarCurso()

  function handleSearch() {
    setFilters((f) => ({ ...f, search: searchInput, page: 1 }))
  }

  function handleEncerrar(id: string, nome: string) {
    if (confirm(`Tem certeza que deseja encerrar o curso "${nome}"? Ele será despublicado.`)) {
      encerrarMutation.mutate(id)
    }
  }

  function handleTogglePublicar(id: string, publicar: boolean) {
    togglePublicarMutation.mutate({ id, publicar })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
        {!isAdmin && (
          <Link to="/cursos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Curso
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-[200px] gap-2">
          <Input
            placeholder="Buscar por nome..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {isAdmin && (
          <Select
            placeholder="Todos os professores"
            options={(professores ?? []).map((p) => ({
              value: p.id,
              label: p.nome_professor,
            }))}
            value={filters.professorId ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, professorId: e.target.value || undefined, page: 1 }))
            }
          />
        )}

        <Select
          placeholder="Todas as categorias"
          options={(categorias ?? []).map((c) => ({
            value: c.id,
            label: c.nome,
          }))}
          value={filters.categoriaId ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, categoriaId: e.target.value || undefined, page: 1 }))
          }
        />

        <Select
          placeholder="Todos os status"
          options={[
            { value: 'publicado', label: 'Publicado' },
            { value: 'rascunho', label: 'Rascunho' },
            { value: 'encerrado', label: 'Encerrado' },
          ]}
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: (e.target.value as CursosFilters['status']) || undefined,
              page: 1,
            }))
          }
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          Erro ao carregar cursos: {error.message}
        </div>
      ) : !data?.cursos.length ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="Nenhum curso encontrado"
          description="Crie seu primeiro curso para começar."
          action={
            !isAdmin ? (
              <Link to="/cursos/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Curso
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                {isAdmin && <TableHead>Professor</TableHead>}
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cursos.map((curso) => {
                const status = getCursoStatus(curso)
                return (
                  <TableRow key={curso.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {curso.imagem ? (
                          <img
                            src={curso.imagem}
                            alt=""
                            className="h-10 w-14 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded bg-gray-100">
                            <BookOpen className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{curso.nome}</p>
                          {curso.is_degustacao && (
                            <Badge variant="info" className="mt-0.5">Degustação</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {curso.professor_profiles?.nome_professor ?? '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      {curso.categorias?.nome ?? '—'}
                    </TableCell>
                    <TableCell>
                      {curso.preco
                        ? `R$ ${Number(curso.preco).toFixed(2)}`
                        : 'Grátis'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {curso.average_rating
                        ? `${Number(curso.average_rating).toFixed(1)} / 5`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!isAdmin && !curso.is_encerrado && (
                          <button
                            onClick={() => handleTogglePublicar(curso.id, !curso.is_publicado)}
                            title={curso.is_publicado ? 'Despublicar' : 'Publicar'}
                            className={`rounded p-1.5 ${
                              curso.is_publicado
                                ? 'text-green-600 hover:bg-green-50 hover:text-green-700'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }`}
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                        )}
                        <Link to={!isAdmin ? "/cursos/$cursoId/editar" : "/cursos/$cursoId"} params={{ cursoId: curso.id }}>
                          <button
                            title={!isAdmin ? 'Ver / Editar' : 'Ver detalhes'}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            {!isAdmin ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </Link>
                        {!isAdmin && !curso.is_encerrado && (
                          <button
                            onClick={() => handleEncerrar(curso.id, curso.nome)}
                            title="Encerrar curso"
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Pagination
            page={filters.page ?? 1}
            totalPages={data.totalPages}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}
    </div>
  )
}
