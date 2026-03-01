import { useState, useRef, useEffect } from 'react'
import { Plus, Send, LifeBuoy } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Drawer } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadFile } from '@/lib/storage'
import type { Chamado, ChamadoMensagem } from './api'
import { fetchChamadoMensagens, sendChamadoMensagem } from './api'

const statusBadge: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'default' }> = {
  aberto: { label: 'Aberto', variant: 'warning' },
  em_andamento: { label: 'Em andamento', variant: 'info' },
  resolvido: { label: 'Resolvido', variant: 'success' },
}

export function MeusChamadosPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null)

  const { data: chamados, isLoading } = useQuery({
    queryKey: ['meus-chamados', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('chamados')
        .select('*, profiles(email, display_name)')
        .eq('user_id', user.id)
        .eq('is_suporte_professor', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Chamado[]
    },
    enabled: !!user,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meus Chamados</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Abrir Chamado
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Abrir Chamado" maxWidth="max-w-lg">
        <NovoChamadoForm onClose={() => setModalOpen(false)} />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !chamados?.length ? (
        <EmptyState
          icon={<LifeBuoy className="h-12 w-12" />}
          title="Nenhum chamado"
          description="Você ainda não abriu nenhum chamado de suporte."
          action={<Button onClick={() => setModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Abrir Chamado</Button>}
        />
      ) : (
        <div className="space-y-3">
          {chamados.map((c) => {
            const badge = statusBadge[c.status ?? 'aberto'] ?? statusBadge.aberto
            return (
              <button
                key={c.id}
                onClick={() => setSelectedChamado(c)}
                className="w-full text-left rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2">{c.descricao ?? 'Sem descrição'}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Drawer
        open={!!selectedChamado}
        onClose={() => setSelectedChamado(null)}
        title="Chamado"
        width="max-w-lg"
      >
        {selectedChamado && <ChamadoChat chamado={selectedChamado} />}
      </Drawer>
    </div>
  )
}

function NovoChamadoForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [descricao, setDescricao] = useState('')
  const [imagem, setImagem] = useState<string | null>(null)
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('chamados').insert({
        user_id: user.id,
        descricao: descricao.trim(),
        imagem,
        is_suporte_professor: true,
        status: 'aberto',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meus-chamados'] })
      onClose()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!descricao.trim()) { setError('Descreva seu problema'); return }
        setError('')
        createMutation.mutate()
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição do problema</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder="Descreva o que está acontecendo..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
      </div>

      <FileUpload
        label="Imagem (opcional)"
        accept="image/*"
        type="image"
        value={imagem}
        onChange={setImagem}
        onUpload={(file) => uploadFile('chamados', file, 'imagens')}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {createMutation.isError && <p className="text-sm text-red-600">Erro ao abrir chamado. Tente novamente.</p>}

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Enviando...' : 'Abrir Chamado'}
        </Button>
      </div>
    </form>
  )
}

function ChamadoChat({ chamado }: { chamado: Chamado }) {
  const [msg, setMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: mensagens, isLoading } = useQuery({
    queryKey: ['chamado-mensagens', chamado.id],
    queryFn: () => fetchChamadoMensagens(chamado.id),
  })

  const sendMutation = useMutation({
    mutationFn: () => sendChamadoMensagem(chamado.id, msg.trim()),
    onSuccess: () => {
      setMsg('')
      qc.invalidateQueries({ queryKey: ['chamado-mensagens', chamado.id] })
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel(`chamado-msgs:${chamado.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chamado_mensagens', filter: `chamado_id=eq.${chamado.id}` }, () => {
        qc.invalidateQueries({ queryKey: ['chamado-mensagens', chamado.id] })
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [chamado.id, qc])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const badge = statusBadge[chamado.status ?? 'aberto'] ?? statusBadge.aberto

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {chamado.created_at ? new Date(chamado.created_at).toLocaleString('pt-BR') : ''}
          </span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <p className="text-sm text-gray-900">{chamado.descricao}</p>
        {chamado.imagem && (
          <a href={chamado.imagem} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver imagem anexada</a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center">Carregando mensagens...</p>
        ) : !mensagens?.length ? (
          <p className="text-sm text-gray-400 text-center py-8">Aguardando resposta do suporte.</p>
        ) : (
          mensagens.map((m) => {
            const isMine = m.user_id === chamado.user_id
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <p className={`text-xs font-medium mb-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                    {isMine ? 'Você' : 'Suporte'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.mensagem}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t border-gray-200 pt-3">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && msg.trim()) { e.preventDefault(); sendMutation.mutate() } }}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button onClick={() => sendMutation.mutate()} disabled={!msg.trim() || sendMutation.isPending} size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
