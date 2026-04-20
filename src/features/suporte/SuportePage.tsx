import { useState, useRef, useEffect, useMemo } from 'react'
import { LifeBuoy, Send, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchChamados, updateChamadoStatus, fetchChamadoMensagens, sendChamadoMensagem } from './api'
import type { Chamado } from './api'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { Drawer } from '@/components/ui/drawer'
import { supabase } from '@/lib/supabase'

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'resolvido', label: 'Resolvido' },
]

const statusBadge: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'default' }> = {
  aberto: { label: 'Aberto', variant: 'warning' },
  em_andamento: { label: 'Em andamento', variant: 'info' },
  resolvido: { label: 'Resolvido', variant: 'success' },
}

export function SuporteAlunosPage() {
  return <SuportePage tipo="aluno" titulo="Chamados de Alunos" />
}

export function SuporteProfessoresPage() {
  return <SuportePage tipo="professor" titulo="Chamados de Professores" />
}

function SuportePage({ tipo, titulo }: { tipo: 'aluno' | 'professor'; titulo: string }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null)
  const qc = useQueryClient()

  const { data: chamados, isLoading } = useQuery({
    queryKey: ['chamados', tipo, statusFilter],
    queryFn: () => fetchChamados(tipo, statusFilter || undefined),
  })

  const filteredChamados = useMemo(() => {
    if (!chamados) return []
    if (!searchQuery.trim()) return chamados
    const q = searchQuery.toLowerCase()
    return chamados.filter((c) =>
      c.profiles?.display_name?.toLowerCase().includes(q) ||
      c.profiles?.email?.toLowerCase().includes(q)
    )
  }, [chamados, searchQuery])

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateChamadoStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chamados', tipo] }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Buscar ${tipo} por nome ou email...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Select
          placeholder="Todos os status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : !filteredChamados.length ? (
        <EmptyState icon={<LifeBuoy className="h-12 w-12" />} title={searchQuery ? 'Nenhum chamado encontrado' : 'Nenhum chamado'} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-32">Alterar Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChamados.map((c) => {
              const badge = statusBadge[c.status ?? 'aberto'] ?? statusBadge.aberto
              return (
                <TableRow key={c.id} className="cursor-pointer hover:bg-blue-50" onClick={() => setSelectedChamado(c)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(c as any).has_nova_mensagem && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{c.profiles?.display_name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{c.profiles?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-sm">{c.descricao ?? '—'}</p>
                  </TableCell>
                  <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                  <TableCell className="text-gray-500">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      options={STATUS_OPTIONS}
                      value={c.status ?? 'aberto'}
                      onChange={(e) => updateStatus.mutate({ id: c.id, status: e.target.value })}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Drawer
        open={!!selectedChamado}
        onClose={() => setSelectedChamado(null)}
        title={`Chamado - ${selectedChamado?.profiles?.display_name ?? 'Usuário'}`}
        width="max-w-lg"
      >
        {selectedChamado && (
          <ChamadoChat
            chamado={selectedChamado}
            onOpen={() => {
              qc.invalidateQueries({ queryKey: ['chamados', tipo] })
            }}
          />
        )}
      </Drawer>
    </div>
  )
}

function ChamadoChat({ chamado, onOpen }: { chamado: Chamado; onOpen?: () => void }) {
  const [msg, setMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  // Marca como lido ao abrir
  useEffect(() => {
    if (!(chamado as any).has_nova_mensagem) return
    supabase
      .from('chamados')
      .update({ has_nova_mensagem: false })
      .eq('id', chamado.id)
      .then(() => onOpen?.())
  }, [chamado.id])

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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chamado-msgs:${chamado.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chamado_mensagens',
          filter: `chamado_id=eq.${chamado.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['chamado-mensagens', chamado.id] })
        },
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [chamado.id, qc])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const badge = statusBadge[chamado.status ?? 'aberto'] ?? statusBadge.aberto

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Chamado info */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center">Carregando mensagens...</p>
        ) : !mensagens?.length ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma mensagem ainda. Envie a primeira resposta.</p>
        ) : (
          mensagens.map((m) => {
            const isAdmin = m.user_id !== chamado.user_id
            return (
              <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <p className={`text-xs font-medium mb-1 ${isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                    {isAdmin ? 'Suporte' : (chamado.profiles?.display_name ?? 'Usuário')}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.mensagem}</p>
                  <p className={`text-xs mt-1 ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-gray-200 pt-3">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && msg.trim()) { e.preventDefault(); sendMutation.mutate() } }}
          placeholder="Digite sua resposta..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button
          onClick={() => sendMutation.mutate()}
          disabled={!msg.trim() || sendMutation.isPending}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
