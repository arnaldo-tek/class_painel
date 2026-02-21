import { useState, type FormEvent } from 'react'
import { PlayCircle, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useTutoriais, useCreateTutorial, useUpdateTutorial, useDeleteTutorial } from './content-hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

export function TutoriaisPage() {
  const { data: tutoriais, isLoading } = useTutoriais()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteMutation = useDeleteTutorial()

  const editing = tutoriais?.find((t) => t.id === editingId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tutoriais</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null) }}><Plus className="mr-2 h-4 w-4" />Novo Tutorial</Button>
      </div>

      {showForm && <TutorialForm editing={editing} onClose={() => { setShowForm(false); setEditingId(null) }} />}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : !tutoriais?.length ? (
        <EmptyState icon={<PlayCircle className="h-12 w-12" />} title="Nenhum tutorial" />
      ) : (
        <div className="space-y-2">
          {tutoriais.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{t.titulo ?? 'Sem título'}</p>
                {t.descricao && <p className="text-sm text-gray-500 line-clamp-1">{t.descricao}</p>}
                {t.video && <a href={t.video} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver vídeo</a>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingId(t.id); setShowForm(true) }} className="rounded p-1.5 text-gray-400 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm(`Excluir "${t.titulo}"?`)) deleteMutation.mutate(t.id) }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TutorialForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const [titulo, setTitulo] = useState(editing?.titulo ?? '')
  const [descricao, setDescricao] = useState(editing?.descricao ?? '')
  const [video, setVideo] = useState(editing?.video ?? '')
  const [error, setError] = useState('')
  const createMutation = useCreateTutorial()
  const updateMutation = useUpdateTutorial()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const payload = { titulo: titulo.trim() || null, descricao: descricao.trim() || null, video: video.trim() || null }
      if (editing) { await updateMutation.mutateAsync({ id: editing.id, ...payload }) }
      else { await createMutation.mutateAsync(payload) }
      onClose()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro') }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center justify-between"><h3 className="font-medium">{editing ? 'Editar' : 'Novo'} Tutorial</h3><button onClick={onClose} className="text-gray-400"><X className="h-4 w-4" /></button></div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <Input placeholder="URL do vídeo" value={video} onChange={(e) => setVideo(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? 'Salvar' : 'Criar'}</Button>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}
