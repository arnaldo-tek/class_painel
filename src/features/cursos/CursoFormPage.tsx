import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCurso, useProfessores, useCategoriasCurso, useCreateCurso, useUpdateCurso } from './hooks'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfessorProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function CursoFormPage() {
  const { cursoId } = useParams({ strict: false }) as { cursoId?: string }
  const isEditing = !!cursoId
  const navigate = useNavigate()
  const { user, isAdmin, isProfessor } = useAuthContext()

  const { data: existingCurso, isLoading: loadingCurso } = useCurso(cursoId)
  const { data: professores } = useProfessores()
  const { data: categorias } = useCategoriasCurso()
  const { data: professorProfile } = useProfessorProfile(isProfessor ? user?.id : undefined)

  const createMutation = useCreateCurso()
  const updateMutation = useUpdateCurso()

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    professor_id: '',
    categoria_id: '',
    video_aula_apresentacao: '',
    taxa_superclasse: '25',
    is_publicado: false,
    is_degustacao: false,
  })

  const [error, setError] = useState('')

  // Preencher form no modo edição
  useEffect(() => {
    if (existingCurso) {
      setForm({
        nome: existingCurso.nome ?? '',
        descricao: existingCurso.descricao ?? '',
        preco: existingCurso.preco ? String(existingCurso.preco) : '',
        professor_id: existingCurso.professor_id ?? '',
        categoria_id: existingCurso.categoria_id ?? '',
        video_aula_apresentacao: existingCurso.video_aula_apresentacao ?? '',
        taxa_superclasse: existingCurso.taxa_superclasse
          ? String(existingCurso.taxa_superclasse)
          : '25',
        is_publicado: existingCurso.is_publicado ?? false,
        is_degustacao: existingCurso.is_degustacao ?? false,
      })
    }
  }, [existingCurso])

  // Professor: setar professor_id automaticamente
  useEffect(() => {
    if (isProfessor && !isAdmin && professorProfile && !form.professor_id) {
      setForm((f) => ({ ...f, professor_id: professorProfile.id }))
    }
  }, [isProfessor, isAdmin, professorProfile, form.professor_id])

  function handleChange(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nome.trim()) {
      setError('Nome do curso é obrigatório')
      return
    }
    if (!form.professor_id) {
      setError('Professor é obrigatório')
      return
    }

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      preco: form.preco ? parseFloat(form.preco) : 0,
      professor_id: form.professor_id,
      categoria_id: form.categoria_id || null,
      video_aula_apresentacao: form.video_aula_apresentacao.trim() || null,
      taxa_superclasse: parseFloat(form.taxa_superclasse) || 25,
      is_publicado: form.is_publicado,
      is_degustacao: form.is_degustacao,
    }

    try {
      if (isEditing && cursoId) {
        await updateMutation.mutateAsync({ id: cursoId, ...payload })
      } else {
        await createMutation.mutateAsync(payload as any)
      }
      navigate({ to: '/cursos' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar curso')
    }
  }

  if (isEditing && loadingCurso) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/cursos' })}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Curso' : 'Novo Curso'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <Input
          id="nome"
          label="Nome do curso *"
          value={form.nome}
          onChange={(e) => handleChange('nome', e.target.value)}
          placeholder="Ex: Direito Administrativo Completo"
          required
        />

        <div className="space-y-1">
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            id="descricao"
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.descricao}
            onChange={(e) => handleChange('descricao', e.target.value)}
            placeholder="Descreva o conteúdo do curso..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="preco"
            label="Preço (R$)"
            type="number"
            step="0.01"
            min="0"
            value={form.preco}
            onChange={(e) => handleChange('preco', e.target.value)}
            placeholder="0.00"
          />

          {isAdmin && (
            <Input
              id="taxa_superclasse"
              label="Taxa plataforma (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.taxa_superclasse}
              onChange={(e) => handleChange('taxa_superclasse', e.target.value)}
            />
          )}
        </div>

        {isAdmin ? (
          <Select
            id="professor_id"
            label="Professor *"
            placeholder="Selecione o professor"
            options={(professores ?? []).map((p) => ({
              value: p.id,
              label: p.nome_professor,
            }))}
            value={form.professor_id}
            onChange={(e) => handleChange('professor_id', e.target.value)}
            required
          />
        ) : (
          <Input
            label="Professor"
            value={professorProfile?.nome_professor ?? 'Carregando...'}
            disabled
          />
        )}

        <Select
          id="categoria_id"
          label="Categoria"
          placeholder="Selecione a categoria"
          options={(categorias ?? []).map((c) => ({
            value: c.id,
            label: c.nome,
          }))}
          value={form.categoria_id}
          onChange={(e) => handleChange('categoria_id', e.target.value)}
        />

        <Input
          id="video_aula_apresentacao"
          label="Vídeo de apresentação (URL)"
          value={form.video_aula_apresentacao}
          onChange={(e) => handleChange('video_aula_apresentacao', e.target.value)}
          placeholder="https://..."
        />

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_publicado}
              onChange={(e) => handleChange('is_publicado', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Publicar curso</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_degustacao}
              onChange={(e) => handleChange('is_degustacao', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Curso de degustação (gratuito)</span>
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar curso'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ to: '/cursos' })}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
