import { useState, type FormEvent } from 'react'
import { Package, Plus, Pencil, Trash2, X, BookOpen, Tags } from 'lucide-react'
import {
  usePacotes, useCreatePacote, useUpdatePacote, useDeletePacote,
  useAllCursos, useAddCursoToPacote, useRemoveCursoFromPacote,
  useAddCategoriaToPacote, useRemoveCategoriaFromPacote,
} from './hooks'
import { useCategorias } from '../categorias/hooks'
import { useCategoria as useCategoriaFiltros, useEstados, useMunicipios, useOrgaos, useCargos, useDisciplinas } from '@/features/cursos/filtros-hooks'
import type { PacoteWithRelations } from './api'
import { uploadFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { EmptyState } from '@/components/ui/empty-state'

export function PacotesPage() {
  const { data: pacotes, isLoading } = usePacotes()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function openNew() {
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pacotes</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pacote
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar Pacote' : 'Novo Pacote'}
        maxWidth="max-w-lg"
      >
        <PacoteForm
          editingId={editingId}
          pacotes={pacotes ?? []}
          onClose={closeModal}
        />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !pacotes?.length ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Nenhum pacote encontrado"
          description="Crie pacotes para agrupar cursos."
          action={
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pacote
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pacotes.map((pacote) => (
            <PacoteCard
              key={pacote.id}
              pacote={pacote}
              onEdit={() => openEdit(pacote.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PacoteForm({
  editingId, pacotes, onClose,
}: { editingId: string | null; pacotes: PacoteWithRelations[]; onClose: () => void }) {
  const existing = pacotes.find((p) => p.id === editingId)
  const [nome, setNome] = useState(existing?.nome ?? '')
  const [descricao, setDescricao] = useState(existing?.descricao ?? '')
  const [preco, setPreco] = useState(existing?.preco ? String(existing.preco) : '')
  const [imagem, setImagem] = useState<string | null>(existing?.imagem ?? null)
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>(
    () => existing?.pacote_categorias.map((pc) => pc.categoria_id) ?? []
  )
  const [estadoId, setEstadoId] = useState('')
  const [estadoNome, setEstadoNome] = useState(existing?.estado ?? '')
  const [municipioId, setMunicipioId] = useState('')
  const [cidadeNome, setCidadeNome] = useState(existing?.cidade ?? '')
  const [orgaoNome, setOrgaoNome] = useState(existing?.orgao ?? '')
  const [cargoNome, setCargoNome] = useState(existing?.cargo ?? '')
  const [disciplinaNome, setDisciplinaNome] = useState(existing?.disciplina ?? '')
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias('pacote')

  // Cascading filters based on category flags
  const activeCategoriaId = selectedCategorias[0] || undefined
  const { data: categoriaFiltros } = useCategoriaFiltros(activeCategoriaId)
  const showEstado = categoriaFiltros?.filtro_estado ?? false
  const showCidade = categoriaFiltros?.filtro_cidade ?? false
  const showOrgao = categoriaFiltros?.filtro_orgao ?? false
  const showCargo = categoriaFiltros?.filtro_cargo ?? false
  const showDisciplina = categoriaFiltros?.filtro_disciplina ?? false

  const { data: estados } = useEstados(showEstado)
  const { data: municipios } = useMunicipios(estadoId || undefined, showCidade && !!estadoId)
  const { data: orgaos } = useOrgaos({ estadoId: estadoId || undefined, municipioId: municipioId || undefined }, showOrgao)
  const { data: cargos } = useCargos({}, showCargo)
  const { data: disciplinas } = useDisciplinas({ estadoId: estadoId || undefined, municipioId: municipioId || undefined }, showDisciplina)

  const createMutation = useCreatePacote()
  const updateMutation = useUpdatePacote()
  const addCategoria = useAddCategoriaToPacote()
  const removeCategoria = useRemoveCategoriaFromPacote()
  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleCategoriaChange(value: string) {
    setSelectedCategorias(value ? [value] : [])
    setEstadoId('')
    setEstadoNome('')
    setMunicipioId('')
    setCidadeNome('')
    setOrgaoNome('')
    setCargoNome('')
    setDisciplinaNome('')
  }

  function handleEstadoChange(value: string, nome: string) {
    setEstadoId(value)
    setEstadoNome(nome)
    setMunicipioId('')
    setCidadeNome('')
    setOrgaoNome('')
  }

  async function syncCategorias(pacoteId: string, originalIds: string[]) {
    const toAdd = selectedCategorias.filter((id) => !originalIds.includes(id))
    const toRemove = originalIds.filter((id) => !selectedCategorias.includes(id))
    await Promise.all([
      ...toAdd.map((categoriaId) => addCategoria.mutateAsync({ pacoteId, categoriaId })),
      ...toRemove.map((categoriaId) => removeCategoria.mutateAsync({ pacoteId, categoriaId })),
    ])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        preco: preco ? parseFloat(preco) : 0,
        imagem,
        estado: showEstado && estadoNome ? estadoNome : null,
        cidade: showCidade && cidadeNome ? cidadeNome : null,
        orgao: showOrgao && orgaoNome ? orgaoNome : null,
        cargo: showCargo && cargoNome ? cargoNome : null,
        disciplina: showDisciplina && disciplinaNome ? disciplinaNome : null,
      }
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload })
        const originalIds = existing?.pacote_categorias.map((pc) => pc.categoria_id) ?? []
        await syncCategorias(editingId, originalIds)
      } else {
        const created = await createMutation.mutateAsync(payload)
        if (selectedCategorias.length > 0) {
          await syncCategorias(created.id, [])
        }
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const categorias = categoriasData?.categorias ?? []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FileUpload
        label="Imagem do Pacote"
        accept="image/*"
        type="image"
        value={imagem}
        onChange={setImagem}
        onUpload={(file) => uploadFile('pacotes', file, 'imagens')}
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nome do Pacote</label>
        <Input placeholder="Nome do pacote" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} required />
        <p className="text-xs text-gray-400">{nome.length}/150 caracteres</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {categorias.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Categoria</label>
          <Select
            placeholder="Selecione a categoria"
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
            value={selectedCategorias[0] ?? ''}
            onChange={(e) => handleCategoriaChange(e.target.value)}
          />
        </div>
      )}

      {/* Filtros cascata - Estado */}
      {showEstado && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <Select
            placeholder="Selecionar estado"
            options={(estados ?? []).map((e: any) => ({ value: e.id, label: e.nome }))}
            value={estadoId}
            onChange={(e) => {
              const selected = (estados ?? []).find((es: any) => es.id === e.target.value)
              handleEstadoChange(e.target.value, selected?.nome ?? '')
            }}
          />
        </div>
      )}

      {/* Filtros cascata - Cidade */}
      {showCidade && estadoId && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Cidade</label>
          <Select
            placeholder="Selecionar cidade"
            options={(municipios ?? []).map((m: any) => ({ value: m.id, label: m.nome }))}
            value={municipioId}
            onChange={(e) => {
              setMunicipioId(e.target.value)
              const selected = (municipios ?? []).find((m: any) => m.id === e.target.value)
              setCidadeNome(selected?.nome ?? '')
            }}
          />
        </div>
      )}

      {/* Filtros cascata - Órgão */}
      {showOrgao && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Órgão</label>
          <Select
            placeholder="Selecionar órgão"
            options={(orgaos ?? []).map((o: any) => ({ value: o.nome, label: o.nome }))}
            value={orgaoNome}
            onChange={(e) => setOrgaoNome(e.target.value)}
          />
        </div>
      )}

      {/* Filtros cascata - Cargo */}
      {showCargo && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Cargo</label>
          <Select
            placeholder="Selecionar cargo"
            options={(cargos ?? []).map((c: any) => ({ value: c.nome, label: c.nome }))}
            value={cargoNome}
            onChange={(e) => setCargoNome(e.target.value)}
          />
        </div>
      )}

      {/* Filtros cascata - Disciplina */}
      {showDisciplina && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Disciplina</label>
          <Select
            placeholder="Selecionar disciplina"
            options={(disciplinas ?? []).map((d: any) => ({ value: d.nome, label: d.nome }))}
            value={disciplinaNome}
            onChange={(e) => setDisciplinaNome(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Preço (R$)</label>
        <Input placeholder="0.00" type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Pacote'}
        </Button>
      </div>
    </form>
  )
}

function PacoteCard({ pacote, onEdit }: { pacote: PacoteWithRelations; onEdit: () => void }) {
  const [showCursos, setShowCursos] = useState(false)
  const [showCategorias, setShowCategorias] = useState(false)
  const [cursoError, setCursoError] = useState('')
  const deleteMutation = useDeletePacote()
  const { data: allCursos } = useAllCursos()
  const { data: categoriasData } = useCategorias('pacote')
  const addCurso = useAddCursoToPacote()
  const removeCurso = useRemoveCursoFromPacote()
  const addCategoria = useAddCategoriaToPacote()
  const removeCategoria = useRemoveCategoriaFromPacote()

  const linkedCursoIds = new Set(pacote.pacote_cursos.map((pc) => pc.curso_id))
  const availableCursos = (allCursos ?? []).filter((c) => !linkedCursoIds.has(c.id))
  const linkedCategoriaIds = new Set(pacote.pacote_categorias.map((pc) => pc.categoria_id))
  const availableCategorias = (categoriasData?.categorias ?? []).filter((c) => !linkedCategoriaIds.has(c.id))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 overflow-hidden">
      {pacote.imagem && (
        <img src={pacote.imagem} alt="" className="h-32 w-full rounded object-cover" />
      )}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 line-clamp-3 break-all">{pacote.nome}</h3>
          {pacote.descricao && <p className="text-sm text-gray-500 mt-1 line-clamp-2 break-all">{pacote.descricao}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
          <button
            onClick={() => { if (confirm(`Excluir pacote "${pacote.nome}"?`)) deleteMutation.mutate(pacote.id) }}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          ><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {pacote.pacote_categorias.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pacote.pacote_categorias.map((pc) => (
            <Badge key={pc.categoria_id} variant="default">{pc.categorias?.nome}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">
          {pacote.preco ? `R$ ${Number(pacote.preco).toFixed(2)}` : 'Grátis'}
        </span>
        <Badge>{pacote.pacote_cursos.length} cursos</Badge>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowCursos(!showCursos)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showCursos ? 'Ocultar cursos' : 'Gerenciar cursos'}
        </button>
        <button
          onClick={() => setShowCategorias(!showCategorias)}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          {showCategorias ? 'Ocultar categorias' : 'Gerenciar categorias'}
        </button>
      </div>

      {showCursos && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          {pacote.pacote_cursos.map((pc) => (
            <div key={pc.curso_id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{pc.cursos?.nome ?? pc.curso_id}</span>
              </div>
              <button
                onClick={() => removeCurso.mutate({ pacoteId: pacote.id, cursoId: pc.curso_id })}
                className="text-gray-400 hover:text-red-600"
              ><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {cursoError && <p className="text-sm text-red-600">{cursoError}</p>}
          {availableCursos.length > 0 && (
            <Select
              placeholder="Adicionar curso..."
              options={availableCursos.map((c) => ({ value: c.id, label: c.nome }))}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setCursoError('')
                  addCurso.mutate(
                    { pacoteId: pacote.id, cursoId: e.target.value },
                    { onError: (err) => setCursoError(err instanceof Error ? err.message : 'Erro ao adicionar curso') },
                  )
                }
              }}
            />
          )}
        </div>
      )}

      {showCategorias && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          {pacote.pacote_categorias.map((pc) => (
            <div key={pc.categoria_id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Tags className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{pc.categorias?.nome ?? pc.categoria_id}</span>
              </div>
              <button
                onClick={() => removeCategoria.mutate({ pacoteId: pacote.id, categoriaId: pc.categoria_id })}
                className="text-gray-400 hover:text-red-600"
              ><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {availableCategorias.length > 0 && (
            <Select
              placeholder="Adicionar categoria..."
              options={availableCategorias.map((c) => ({ value: c.id, label: c.nome }))}
              value=""
              onChange={(e) => {
                if (e.target.value) addCategoria.mutate({ pacoteId: pacote.id, categoriaId: e.target.value })
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
