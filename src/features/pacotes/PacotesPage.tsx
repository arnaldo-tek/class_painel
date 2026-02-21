import { useState, type FormEvent } from 'react'
import { Package, Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react'
import {
  usePacotes, useCreatePacote, useUpdatePacote, useDeletePacote,
  useAllCursos, useAddCursoToPacote, useRemoveCursoFromPacote,
} from './hooks'
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
  const [error, setError] = useState('')

  const createMutation = useCreatePacote()
  const updateMutation = useUpdatePacote()
  const isSaving = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        preco: preco ? parseFloat(preco) : 0,
        imagem,
      }
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

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
        <Input placeholder="Nome do pacote" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>

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
  const deleteMutation = useDeletePacote()
  const { data: allCursos } = useAllCursos()
  const addCurso = useAddCursoToPacote()
  const removeCurso = useRemoveCursoFromPacote()

  const linkedCursoIds = new Set(pacote.pacote_cursos.map((pc) => pc.curso_id))
  const availableCursos = (allCursos ?? []).filter((c) => !linkedCursoIds.has(c.id))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      {pacote.imagem && (
        <img src={pacote.imagem} alt="" className="h-32 w-full rounded object-cover" />
      )}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{pacote.nome}</h3>
          {pacote.descricao && <p className="text-sm text-gray-500 mt-1">{pacote.descricao}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
          <button
            onClick={() => { if (confirm(`Excluir pacote "${pacote.nome}"?`)) deleteMutation.mutate(pacote.id) }}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          ><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">
          {pacote.preco ? `R$ ${Number(pacote.preco).toFixed(2)}` : 'Grátis'}
        </span>
        <Badge>{pacote.pacote_cursos.length} cursos</Badge>
      </div>

      <button
        onClick={() => setShowCursos(!showCursos)}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        {showCursos ? 'Ocultar cursos' : 'Gerenciar cursos'}
      </button>

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
          {availableCursos.length > 0 && (
            <Select
              placeholder="Adicionar curso..."
              options={availableCursos.map((c) => ({ value: c.id, label: c.nome }))}
              value=""
              onChange={(e) => {
                if (e.target.value) addCurso.mutate({ pacoteId: pacote.id, cursoId: e.target.value })
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
