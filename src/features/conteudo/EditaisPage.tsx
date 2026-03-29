import { useState, type FormEvent } from 'react'
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react'
import { useEditais, useCreateEdital, useUpdateEdital, useDeleteEdital } from './noticias-hooks'
import { useCategorias } from '@/features/categorias/hooks'
import { useCategoria as useCategoriaFiltros, useEstados, useMunicipios, useOrgaos, useCargos, useDisciplinas } from '@/features/cursos/filtros-hooks'
import { uploadFile } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

export function EditaisPage() {
  const { data: editais, isLoading } = useEditais()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteMutation = useDeleteEdital()

  const editing = editais?.find((e: any) => e.id === editingId)

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
        <h1 className="text-2xl font-bold text-gray-900">Editais</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Edital
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Edital' : 'Novo Edital'}
        maxWidth="max-w-2xl"
      >
        <EditalForm editing={editing} onClose={closeModal} />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !editais?.length ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Nenhum edital"
          description="Crie o primeiro edital."
          action={
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Edital
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editais.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {e.imagem && (
                      <img src={e.imagem} alt="" className="h-10 w-14 rounded object-cover" />
                    )}
                    <span className="font-medium">{e.titulo}</span>
                  </div>
                </TableCell>
                <TableCell>{e.categorias?.nome ?? '—'}</TableCell>
                <TableCell className="text-gray-500">
                  {e.created_at ? new Date(e.created_at).toLocaleDateString('pt-BR') : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm(`Excluir "${e.titulo}"?`)) deleteMutation.mutate(e.id) }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function EditalForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const [titulo, setTitulo] = useState(editing?.titulo ?? '')
  const [resumo, setResumo] = useState(editing?.resumo ?? '')
  const [descricao, setDescricao] = useState(editing?.descricao ?? '')
  const [categoriaId, setCategoriaId] = useState(editing?.categoria_id ?? '')
  const [estadoId, setEstadoId] = useState('')
  const [estadoNome, setEstadoNome] = useState(editing?.estado ?? '')
  const [municipioId, setMunicipioId] = useState('')
  const [cidadeNome, setCidadeNome] = useState(editing?.cidade ?? '')
  const [orgaoNome, setOrgaoNome] = useState(editing?.orgao ?? '')
  const [cargoNome, setCargoNome] = useState(editing?.cargo ?? '')
  const [disciplinaNome, setDisciplinaNome] = useState(editing?.disciplina ?? '')
  const [imagem, setImagem] = useState<string | null>(editing?.imagem ?? null)
  const [pdf, setPdf] = useState<string | null>(editing?.pdf ?? null)
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias('edital')
  const categorias = categoriasData?.categorias ?? []

  // Cascading filters based on category flags
  const { data: categoriaFiltros } = useCategoriaFiltros(categoriaId || undefined)
  const showEstado = categoriaFiltros?.filtro_estado ?? false
  const showCidade = categoriaFiltros?.filtro_cidade ?? false
  const showOrgao = categoriaFiltros?.filtro_orgao_editais_noticias ?? false
  const showCargo = categoriaFiltros?.filtro_cargo ?? false
  const showDisciplina = categoriaFiltros?.filtro_disciplina ?? false

  const { data: estados } = useEstados(showEstado)
  const { data: municipios } = useMunicipios(estadoId || undefined, showCidade && !!estadoId)
  const { data: orgaos } = useOrgaos({ estadoId: estadoId || undefined, municipioId: municipioId || undefined }, showOrgao)
  const { data: cargos } = useCargos({}, showCargo)
  const { data: disciplinas } = useDisciplinas({ estadoId: estadoId || undefined, municipioId: municipioId || undefined }, showDisciplina)

  const createMutation = useCreateEdital()
  const updateMutation = useUpdateEdital()
  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleCategoriaChange(value: string) {
    setCategoriaId(value)
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Título do edital é obrigatório'); return }
    try {
      const payload = {
        titulo: titulo.trim(),
        resumo: resumo.trim() || null,
        descricao: descricao.trim() || null,
        categoria_id: categoriaId || null,
        estado: showEstado && estadoNome ? estadoNome : null,
        cidade: showCidade && cidadeNome ? cidadeNome : null,
        orgao: showOrgao && orgaoNome ? orgaoNome : null,
        cargo: showCargo && cargoNome ? cargoNome : null,
        disciplina: showDisciplina && disciplinaNome ? disciplinaNome : null,
        imagem,
        pdf,
      }
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload as any)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Upload de imagem e PDF */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FileUpload
          label="Imagem do Edital"
          accept="image/*"
          type="image"
          value={imagem}
          onChange={setImagem}
          onUpload={(file) => uploadFile('editais', file, 'imagens')}
        />
        <FileUpload
          label="PDF do Edital"
          accept="application/pdf"
          type="pdf"
          value={pdf}
          onChange={setPdf}
          onUpload={(file) => uploadFile('editais', file, 'pdfs')}
        />
      </div>

      {/* Título do edital */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Título do Edital</label>
        <Input
          placeholder="Ex: Edital TJSP 2026"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
      </div>

      {/* Resumo */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição Resumida</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={2}
          placeholder="Breve resumo do edital..."
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
        />
      </div>

      {/* Descrição completa */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição Completa</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder="Descrição detalhada do edital..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      {/* Categoria */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Categoria</label>
        <Select
          placeholder="Selecionar categoria"
          options={(categorias as any[]).map((c: any) => ({ value: c.id, label: c.nome }))}
          value={categoriaId}
          onChange={(e) => handleCategoriaChange(e.target.value)}
        />
      </div>

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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Edital'}
        </Button>
      </div>
    </form>
  )
}
