import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, ListVideo } from 'lucide-react'
import { useCurso, useProfessores, useCategoriasCurso, useCreateCurso, useUpdateCurso } from './hooks'
import {
  useCategoria,
  useEstados,
  useMunicipios,
  useEscolaridades,
  useNiveis,
  useOrgaos,
  useCargos,
  useDisciplinas,
} from './filtros-hooks'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfessorProfile } from '@/hooks/useProfile'
import { useSetting } from '@/features/configuracoes/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadFile } from '@/lib/storage'

export function CursoFormPage() {
  const { cursoId } = useParams({ strict: false }) as { cursoId?: string }
  const isEditing = !!cursoId
  const navigate = useNavigate()
  const { user, isAdmin, isProfessor } = useAuthContext()

  const { data: existingCurso, isLoading: loadingCurso } = useCurso(cursoId)
  const { data: professores } = useProfessores()
  const { data: categorias } = useCategoriasCurso()
  const { data: professorProfile } = useProfessorProfile(isProfessor ? user?.id : undefined)
  const { data: markupSetting } = useSetting('markup_percentage')
  const defaultMarkup = markupSetting ?? '30'

  const createMutation = useCreateCurso()
  const updateMutation = useUpdateCurso()

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    professor_id: '',
    categoria_id: '',
    video_aula_apresentacao: '',
    taxa_superclasse: '',
    is_publicado: false,
    is_degustacao: false,
    imagem: '' as string | null,
    // Filter name values (saved to cursos table)
    estado: '',
    cidade: '',
    orgao: '',
    escolaridade: '',
    cargo: '',
    disciplina_id: '',
    // Filter IDs (used for cascading queries, not saved)
    estado_id: '',
    municipio_id: '',
    orgao_id: '',
    escolaridade_id: '',
    cargo_id: '',
    nivel_id: '',
  })

  const [error, setError] = useState('')

  // Fetch categoria flags
  const { data: categoriaFiltros } = useCategoria(form.categoria_id || undefined)

  const filtroEstado = categoriaFiltros?.filtro_estado ?? false
  const filtroCidade = categoriaFiltros?.filtro_cidade ?? false
  const filtroEscolaridade = categoriaFiltros?.filtro_escolaridade ?? false
  const filtroNivel = categoriaFiltros?.filtro_nivel ?? false
  const filtroOrgao = categoriaFiltros?.filtro_orgao ?? false
  const filtroCargo = categoriaFiltros?.filtro_cargo ?? false
  const filtroDisciplina = categoriaFiltros?.filtro_disciplina ?? false

  // Conditional data fetches
  const { data: estados } = useEstados(filtroEstado)
  const { data: municipios } = useMunicipios(form.estado_id || undefined, filtroCidade && !!form.estado_id)
  const { data: escolaridades } = useEscolaridades(filtroEscolaridade)
  const { data: niveis } = useNiveis(filtroNivel)
  const { data: orgaos } = useOrgaos(
    {
      categoriaId: form.categoria_id || undefined,
      estadoId: form.estado_id || undefined,
      municipioId: form.municipio_id || undefined,
    },
    filtroOrgao,
  )
  const { data: cargos } = useCargos(
    {
      orgaoId: form.orgao_id || undefined,
      escolaridadeId: form.escolaridade_id || undefined,
      categoriaId: form.categoria_id || undefined,
    },
    filtroCargo,
  )
  const { data: disciplinas } = useDisciplinas(
    {
      cargoId: form.cargo_id || undefined,
      categoriaId: form.categoria_id || undefined,
      estadoId: form.estado_id || undefined,
      municipioId: form.municipio_id || undefined,
      orgaoId: form.orgao_id || undefined,
    },
    filtroDisciplina,
  )

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
          : defaultMarkup,
        is_publicado: existingCurso.is_publicado ?? false,
        is_degustacao: existingCurso.is_degustacao ?? false,
        imagem: existingCurso.imagem ?? null,
        estado: existingCurso.estado ?? '',
        cidade: existingCurso.cidade ?? '',
        orgao: existingCurso.orgao ?? '',
        escolaridade: existingCurso.escolaridade ?? '',
        cargo: existingCurso.cargo ?? '',
        disciplina_id: existingCurso.disciplina_id ?? '',
        // IDs will be empty on edit — user must re-select if changing filters
        estado_id: '',
        municipio_id: '',
        orgao_id: '',
        escolaridade_id: '',
        cargo_id: '',
        nivel_id: (existingCurso as any).nivel_id ?? '',
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

  function handleCategoriaChange(categoriaId: string) {
    setForm((f) => ({
      ...f,
      categoria_id: categoriaId,
      estado: '', cidade: '', orgao: '', escolaridade: '', cargo: '', disciplina_id: '',
      estado_id: '', municipio_id: '', orgao_id: '', escolaridade_id: '', cargo_id: '', nivel_id: '',
    }))
  }

  function handleEstadoChange(estadoId: string) {
    const estadoNome = estados?.find((e) => e.id === estadoId)?.nome ?? ''
    setForm((f) => ({
      ...f,
      estado_id: estadoId,
      estado: estadoNome,
      // Reset dependents
      municipio_id: '', cidade: '',
      orgao_id: '', orgao: '',
      cargo_id: '', cargo: '',
      disciplina_id: '',
    }))
  }

  function handleMunicipioChange(municipioId: string) {
    const municipioNome = municipios?.find((m) => m.id === municipioId)?.nome ?? ''
    setForm((f) => ({
      ...f,
      municipio_id: municipioId,
      cidade: municipioNome,
      // Reset dependents
      orgao_id: '', orgao: '',
      cargo_id: '', cargo: '',
      disciplina_id: '',
    }))
  }

  function handleEscolaridadeChange(escolaridadeId: string) {
    const escolaridadeNome = escolaridades?.find((e) => e.id === escolaridadeId)?.nome ?? ''
    setForm((f) => ({
      ...f,
      escolaridade_id: escolaridadeId,
      escolaridade: escolaridadeNome,
      // Reset dependents that use escolaridade
      orgao_id: '', orgao: '',
      cargo_id: '', cargo: '',
      disciplina_id: '',
    }))
  }

  function handleNivelChange(nivelId: string) {
    setForm((f) => ({ ...f, nivel_id: nivelId }))
  }

  function handleOrgaoChange(orgaoId: string) {
    const orgaoNome = orgaos?.find((o) => o.id === orgaoId)?.nome ?? ''
    setForm((f) => ({
      ...f,
      orgao_id: orgaoId,
      orgao: orgaoNome,
      // Reset dependents
      cargo_id: '', cargo: '',
      disciplina_id: '',
    }))
  }

  function handleCargoChange(cargoId: string) {
    const cargoNome = cargos?.find((c) => c.id === cargoId)?.nome ?? ''
    setForm((f) => ({
      ...f,
      cargo_id: cargoId,
      cargo: cargoNome,
      disciplina_id: '',
    }))
  }

  function handleDisciplinaChange(disciplinaId: string) {
    setForm((f) => ({ ...f, disciplina_id: disciplinaId }))
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
      taxa_superclasse: parseFloat(defaultMarkup) || 30,
      is_publicado: form.is_publicado,
      is_degustacao: form.is_degustacao,
      imagem: form.imagem || null,
      estado: form.estado || null,
      cidade: form.cidade || null,
      orgao: form.orgao || null,
      escolaridade: form.escolaridade || null,
      cargo: form.cargo || null,
      disciplina_id: form.disciplina_id || null,
      nivel_id: form.nivel_id || null,
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

  const professorApproved = isAdmin || !isProfessor || (professorProfile?.approval_status === 'aprovado' && !professorProfile?.is_blocked)

  if (!isEditing && !professorApproved) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-5 text-center">
          <p className="text-sm text-amber-800">
            {professorProfile?.approval_status === 'reprovado'
              ? 'Seu cadastro foi reprovado. Entre em contato com o suporte para mais informações.'
              : 'Seu cadastro está em análise. Você poderá criar cursos após a aprovação.'}
          </p>
          <Link to="/cursos" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
            Voltar para cursos
          </Link>
        </div>
      </div>
    )
  }

  if (isEditing && loadingCurso) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const hasAnyFilter = filtroEstado || filtroCidade || filtroEscolaridade || filtroNivel || filtroOrgao || filtroCargo || filtroDisciplina

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
        <h1 className="flex-1 text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Curso' : 'Novo Curso'}
        </h1>
        {isEditing && cursoId && (
          <Link to="/cursos/$cursoId" params={{ cursoId }}>
            <Button variant="secondary">
              <ListVideo className="mr-2 h-4 w-4" />
              Modulos e Aulas
            </Button>
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <FileUpload
          label="Imagem do curso"
          accept="image/*"
          type="image"
          value={form.imagem}
          onChange={(url) => setForm((f) => ({ ...f, imagem: url }))}
          onUpload={(file) => uploadFile('cursos', file, 'imagens')}
        />

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

        <div className="space-y-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="preco"
              label="Preço do professor (R$)"
              type="number"
              step="0.01"
              min="0"
              value={form.preco}
              onChange={(e) => handleChange('preco', e.target.value)}
              placeholder="0.00"
            />

          </div>

          {form.preco && parseFloat(form.preco) > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm text-blue-800">
                Preço final para o aluno:{' '}
                <strong>
                  R$ {(parseFloat(form.preco) * (1 + (parseFloat(defaultMarkup) || 30) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <span className="ml-2 text-xs text-blue-600">
                  (margem de {defaultMarkup}%)
                </span>
              </p>
            </div>
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
          onChange={(e) => handleCategoriaChange(e.target.value)}
        />

        {/* Filtros condicionais do concurso */}
        {hasAnyFilter && (
          <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700">Filtros do concurso</h3>

            {filtroEstado && (
              <Select
                id="estado_id"
                label="Estado"
                placeholder="Selecione o estado"
                options={(estados ?? []).map((e) => ({ value: e.id, label: e.nome }))}
                value={form.estado_id}
                onChange={(e) => handleEstadoChange(e.target.value)}
              />
            )}

            {filtroCidade && form.estado_id && (
              <Select
                id="municipio_id"
                label="Cidade"
                placeholder="Selecione a cidade"
                options={(municipios ?? []).map((m) => ({ value: m.id, label: m.nome }))}
                value={form.municipio_id}
                onChange={(e) => handleMunicipioChange(e.target.value)}
              />
            )}

            {filtroEscolaridade && (
              <Select
                id="escolaridade_id"
                label="Escolaridade"
                placeholder="Selecione a escolaridade"
                options={(escolaridades ?? []).map((e) => ({ value: e.id, label: e.nome }))}
                value={form.escolaridade_id}
                onChange={(e) => handleEscolaridadeChange(e.target.value)}
              />
            )}

            {filtroNivel && (
              <Select
                id="nivel_id"
                label="Nível"
                placeholder="Selecione o nível"
                options={(niveis ?? []).map((n) => ({ value: n.id, label: n.nome }))}
                value={form.nivel_id}
                onChange={(e) => handleNivelChange(e.target.value)}
              />
            )}

            {filtroOrgao && (
              <Select
                id="orgao_id"
                label="Órgão"
                placeholder="Selecione o órgão"
                options={(orgaos ?? []).map((o) => ({ value: o.id, label: o.nome }))}
                value={form.orgao_id}
                onChange={(e) => handleOrgaoChange(e.target.value)}
              />
            )}

            {filtroCargo && (
              <Select
                id="cargo_id"
                label="Cargo"
                placeholder="Selecione o cargo"
                options={(cargos ?? []).map((c) => ({ value: c.id, label: c.nome }))}
                value={form.cargo_id}
                onChange={(e) => handleCargoChange(e.target.value)}
              />
            )}

            {filtroDisciplina && (
              <Select
                id="disciplina_id"
                label="Disciplina"
                placeholder="Selecione a disciplina"
                options={(disciplinas ?? []).map((d) => ({ value: d.id, label: d.nome }))}
                value={form.disciplina_id}
                onChange={(e) => handleDisciplinaChange(e.target.value)}
              />
            )}
          </div>
        )}

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
