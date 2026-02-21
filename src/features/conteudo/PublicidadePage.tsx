import { useState, type FormEvent } from 'react'
import { Megaphone, Plus, Trash2, X, Image } from 'lucide-react'
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from './content-hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

export function PublicidadePage() {
  const { data: banners, isLoading } = useBanners()
  const [showForm, setShowForm] = useState(false)
  const [imagem, setImagem] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const createMutation = useCreateBanner()
  const updateMutation = useUpdateBanner()
  const deleteMutation = useDeleteBanner()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!imagem.trim()) { setError('URL da imagem é obrigatória'); return }
    try {
      await createMutation.mutateAsync({ imagem: imagem.trim(), redirecionamento: link.trim() || null, sort_order: banners?.length ?? 0 })
      setImagem(''); setLink(''); setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Publicidade / Banners</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" />Novo Banner</Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-medium">Novo Banner</h3><button onClick={() => setShowForm(false)} className="text-gray-400"><X className="h-4 w-4" /></button></div>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]"><Input placeholder="URL da imagem" value={imagem} onChange={(e) => setImagem(e.target.value)} required /></div>
            <div className="flex-1 min-w-[200px]"><Input placeholder="Link de redirecionamento" value={link} onChange={(e) => setLink(e.target.value)} /></div>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>Criar</Button>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : !banners?.length ? (
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="Nenhum banner" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <div key={b.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              {b.imagem ? (
                <img src={b.imagem} alt="" className="h-32 w-full object-cover" />
              ) : (
                <div className="h-32 bg-gray-100 flex items-center justify-center"><Image className="h-8 w-8 text-gray-300" /></div>
              )}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <Badge variant={b.is_active ? 'success' : 'default'}>{b.is_active ? 'Ativo' : 'Inativo'}</Badge>
                  {b.redirecionamento && <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">{b.redirecionamento}</p>}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateMutation.mutate({ id: b.id, is_active: !b.is_active })}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 text-xs"
                  >{b.is_active ? 'Desativar' : 'Ativar'}</button>
                  <button onClick={() => { if (confirm('Excluir banner?')) deleteMutation.mutate(b.id) }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
