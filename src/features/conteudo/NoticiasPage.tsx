import { useState, type FormEvent } from 'react'
import { Newspaper, Plus, Pencil, Trash2 } from 'lucide-react'
import { useNoticias, useCreateNoticia, useUpdateNoticia, useDeleteNoticia } from './noticias-hooks'
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

export function NoticiasPage() {
  const { data: noticias, isLoading } = useNoticias()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteMutation = useDeleteNoticia()

  const editing = noticias?.find((n: any) => n.id === editingId)

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
        <h1 className="text-2xl font-bold text-gray-900">Notícias</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Notícia
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar Notícia' : 'Nova Notícia'}
        maxWidth="max-w-2xl"
      >
        <NoticiaForm editing={editing} onClose={closeModal} />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !noticias?.length ? (
        <EmptyState
          icon={<Newspaper className="h-12 w-12" />}
          title="Nenhuma notícia"
          description="Crie a primeira notícia."
          action={
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Notícia
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
            {noticias.map((n: any) => (
              <TableRow key={n.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {n.imagem && (
                      <img src={n.imagem} alt="" className="h-10 w-14 rounded object-cover" />
                    )}
                    <span className="font-medium">{n.titulo}</span>
                  </div>
                </TableCell>
                <TableCell>{n.categorias?.nome ?? '—'}</TableCell>
                <TableCell className="text-gray-500">
                  {n.created_at ? new Date(n.created_at).toLocaleDateString('pt-BR') : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(n.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm(`Excluir "${n.titulo}"?`)) deleteMutation.mutate(n.id) }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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

function NoticiaForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const [titulo, setTitulo] = useState(editing?.titulo ?? '')
  const [descricao, setDescricao] = useState(editing?.descricao ?? '')
  const [categoriaId, setCategoriaId] = useState(editing?.categoria_id ?? '')
  const [estadoId, setEstadoId] = useState(editing?.estado ? '' : '')
  const [estadoNome, setEstadoNome] = useState(editing?.estado ?? '')
  const [municipioId, setMunicipioId] = useState('')
  const [cidadeNome, setCidadeNome] = useState(editing?.cidade ?? '')
  const [orgaoNome, setOrgaoNome] = useState(editing?.orgao ?? '')
  const [cargoNome, setCargoNome] = useState(editing?.cargo ?? '')
  const [disciplinaNome, setDisciplinaNome] = useState(editing?.disciplina ?? '')
  const [imagem, setImagem] = useState<string | null>(editing?.imagem ?? null)
  const [error, setError] = useState('')

  const { data: categoriasData } = useCategorias('noticia')
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

  const createMutation = useCreateNoticia()
  const updateMutation = useUpdateNoticia()
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
    if (!titulo.trim()) { setError('Título é obrigatório'); return }
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        categoria_id: categoriaId || null,
        estado: showEstado && estadoNome ? estadoNome : null,
        cidade: showCidade && cidadeNome ? cidadeNome : null,
        orgao: showOrgao && orgaoNome ? orgaoNome : null,
        cargo: showCargo && cargoNome ? cargoNome : null,
        disciplina: showDisciplina && disciplinaNome ? disciplinaNome : null,
        imagem,
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
      <FileUpload
        label="Imagem da Notícia"
        accept="image/*"
        type="image"
        value={imagem}
        onChange={setImagem}
        onUpload={(file) => uploadFile('noticias', file, 'imagens')}
      />

      {/* Título */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Título</label>
        <Input
          placeholder="Título da notícia"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder="Conteúdo da notícia..."
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
          {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Notícia'}
        </Button>
      </div>
    </form>
  )
}
