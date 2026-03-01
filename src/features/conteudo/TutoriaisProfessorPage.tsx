import { useState } from 'react'
import { PlayCircle, FileText, Search, Video, BookOpen, ExternalLink } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/empty-state'
import type { Tutorial } from './content-api'

type TipoTutorial = 'Video' | 'PDF'

function useTutoriaisProfessor() {
  return useQuery({
    queryKey: ['tutoriais-professor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutoriais')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function TutoriaisProfessorPage() {
  const { data: tutoriais, isLoading } = useTutoriaisProfessor()
  const [tab, setTab] = useState<TipoTutorial>('Video')
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = (tutoriais ?? []).filter((t) => {
    const tipo = t.tipo_tutorial ?? 'Video'
    if (tipo !== tab) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (
        !t.titulo?.toLowerCase().includes(term) &&
        !t.descricao?.toLowerCase().includes(term)
      ) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tutoriais</h1>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        {([
          { key: 'Video' as const, label: 'Tutoriais em Vídeo', icon: Video },
          { key: 'PDF' as const, label: 'Manuais (PDF)', icon: BookOpen },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearchTerm('') }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar ${tab === 'Video' ? 'vídeos' : 'manuais'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={tab === 'Video' ? <PlayCircle className="h-12 w-12" /> : <FileText className="h-12 w-12" />}
          title={searchTerm ? 'Nenhum resultado' : `Nenhum ${tab === 'Video' ? 'tutorial em vídeo' : 'manual'} disponível`}
          description={searchTerm ? 'Tente buscar com outros termos.' : 'Nenhum tutorial foi publicado ainda.'}
        />
      ) : tab === 'Video' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-gray-900">
                {t.video ? (
                  isEmbeddable(t.video) ? (
                    <iframe
                      src={getEmbedUrl(t.video)}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={t.video} className="h-full w-full object-cover" controls preload="metadata" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{t.titulo ?? 'Sem título'}</h3>
                {t.descricao && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{t.descricao}</p>}
                <span className="mt-2 block text-xs text-gray-400">
                  {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
              <div className="relative h-40 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                <FileText className="h-16 w-16 text-red-400" />
                {t.pdf && (
                  <a href={t.pdf} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                    <span className="sr-only">Abrir PDF</span>
                  </a>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{t.titulo ?? 'Sem título'}</h3>
                {t.descricao && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{t.descricao}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : ''}
                  </span>
                  {t.pdf && (
                    <a href={t.pdf} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function isEmbeddable(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}
