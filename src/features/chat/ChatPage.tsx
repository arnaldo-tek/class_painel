import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/cn'

export function ChatPage() {
  const { user } = useAuthContext()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('chats')
        .select('*, user_a_profile:profiles!chats_user_a_fkey(display_name, email), user_b_profile:profiles!chats_user_b_fkey(display_name, email)')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_time', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Chat list */}
      <div className="w-72 shrink-0 overflow-y-auto rounded-lg border border-gray-200 bg-white">
        <div className="p-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Conversas</h2>
        </div>
        {isLoading ? (
          <p className="p-3 text-sm text-gray-400">Carregando...</p>
        ) : !chats?.length ? (
          <p className="p-3 text-sm text-gray-400">Nenhuma conversa.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat: any) => {
              const other = chat.user_a === user?.id ? chat.user_b_profile : chat.user_a_profile
              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={cn(
                    'w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors',
                    selectedChatId === chat.id && 'bg-blue-50',
                  )}
                >
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {other?.display_name ?? other?.email ?? '—'}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {chat.last_message ?? 'Sem mensagens'}
                  </p>
                  {!chat.message_seen && chat.last_message_sent_by !== user?.id && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mt-1" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      {selectedChatId ? (
        <ChatMessages chatId={selectedChatId} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={<MessageCircle className="h-12 w-12" />} title="Selecione uma conversa" />
        </div>
      )}
    </div>
  )
}

function ChatMessages({ chatId }: { chatId: string }) {
  const { user } = useAuthContext()
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: messages } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['chat-messages', chatId] })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, qc])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from('chat_messages').insert({
        chat_id: chatId,
        user_id: user!.id,
        text,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', chatId] })
      qc.invalidateQueries({ queryKey: ['chats'] })
    },
  })

  function handleSend() {
    if (!text.trim()) return
    sendMutation.mutate(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(messages ?? []).map((msg) => {
          const isMe = msg.user_id === user?.id
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900',
              )}>
                <p>{msg.text}</p>
                <p className={cn('text-xs mt-1', isMe ? 'text-blue-200' : 'text-gray-400')}>
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <Input
          placeholder="Digite uma mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!text.trim() || sendMutation.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
