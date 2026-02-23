import { useState, useMemo, useCallback, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { GraduationCap, CheckCircle, XCircle, Star, Search, Plus, Loader2 } from 'lucide-react'
import { useProfessores, useUpdateProfessorStatus, useCreateProfessor } from './hooks'
import { useEstados, useMunicipiosByEstado } from '@/features/filtros/hooks'
import type { ProfessorProfile, CreateProfessorData } from './api'
import type { ApprovalStatus } from '@/types/enums'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'

const STATUS_OPTIONS: { value: ApprovalStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
]

const statusBadge: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  em_analise: { label: 'Em análise', variant: 'warning' },
  aprovado: { label: 'Aprovado', variant: 'success' },
  reprovado: { label: 'Reprovado', variant: 'danger' },
}

export function ProfessoresPage() {
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | ''>('')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { data: professores, isLoading } = useProfessores(statusFilter || undefined)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!professores) return []
    if (!search.trim()) return professores
    const q = search.toLowerCase()
    return professores.filter(
      (p) =>
        p.nome_professor.toLowerCase().includes(q) ||
        p.profiles?.email?.toLowerCase().includes(q) ||
        p.disciplina?.toLowerCase().includes(q),
    )
  }, [professores, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Professores</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Cadastrar Professor
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome, email ou disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value as ApprovalStatus | '')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="Nenhum professor encontrado"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((prof) => (
            <ProfessorCard
              key={prof.id}
              professor={prof}
              onClick={() => navigate({ to: '/professores/$professorId', params: { professorId: prof.id } })}
            />
          ))}
        </div>
      )}

      <CreateProfessorModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}

function ProfessorCard({ professor, onClick }: { professor: ProfessorProfile; onClick: () => void }) {
  const updateStatus = useUpdateProfessorStatus()
  const badge = statusBadge[professor.approval_status ?? 'em_analise']

  return (
    <div
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {professor.foto_perfil ? (
          <img
            src={professor.foto_perfil}
            alt={professor.nome_professor}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
            {professor.nome_professor.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900 group-hover:text-blue-600">
            {professor.nome_professor}
          </p>
          {professor.disciplina && (
            <p className="truncate text-sm text-gray-500">{professor.disciplina}</p>
          )}
          <p className="truncate text-xs text-gray-400">{professor.profiles?.email ?? '—'}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Star className="h-3.5 w-3.5 text-yellow-500" />
          <span>{professor.average_rating ? Number(professor.average_rating).toFixed(1) : '—'}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
        {professor.approval_status !== 'aprovado' && (
          <button
            onClick={() => updateStatus.mutate({ id: professor.id, status: 'aprovado' })}
            disabled={updateStatus.isPending}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
            title="Aprovar"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Aprovar
          </button>
        )}
        {professor.approval_status !== 'reprovado' && (
          <button
            onClick={() => updateStatus.mutate({ id: professor.id, status: 'reprovado' })}
            disabled={updateStatus.isPending}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            title="Reprovar"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reprovar
          </button>
        )}
      </div>
    </div>
  )
}

const emptyForm: CreateProfessorData = {
  email: '',
  password: '',
  nome_professor: '',
  telefone: '',
  cpf_cnpj: '',
  disciplina: '',
  rua: '',
  numero_casa_ap: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  banco: '',
  agencia: '',
  digito_agencia: '',
  conta: '',
  digito_conta: '',
  data_nascimento: '',
  ddd: '',
  account_type: 'checking',
}

function CreateProfessorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateProfessor()
  const [form, setForm] = useState<CreateProfessorData>({ ...emptyForm })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [cepLoading, setCepLoading] = useState(false)

  const { data: estadosData } = useEstados()
  const estados = estadosData?.items ?? []
  const selectedEstadoId = estados.find((e) => e.nome === form.estado)?.id
  const { data: municipios } = useMunicipiosByEstado(selectedEstadoId)

  function onChange(field: keyof CreateProfessorData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleEstadoChange(estadoNome: string) {
    setForm((prev) => ({ ...prev, estado: estadoNome, cidade: '' }))
  }

  const fetchViaCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) return
      const estadoMatch = estados.find((e) => e.uf === data.uf)
      setForm((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: estadoMatch?.nome ?? prev.estado,
      }))
    } catch { /* ignore */ } finally {
      setCepLoading(false)
    }
  }, [estados])

  function handleCepChange(value: string) {
    onChange('cep', value)
    const digits = value.replace(/\D/g, '')
    if (digits.length === 8) fetchViaCep(digits)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nome_professor.trim()) {
      setError('Nome é obrigatório')
      return
    }
    if (!form.email.trim()) {
      setError('E-mail é obrigatório')
      return
    }
    if (!form.password || form.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres')
      return
    }
    if (form.password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    createMutation.mutate(form, {
      onSuccess: () => {
        setForm({ ...emptyForm })
        setConfirmPassword('')
        onClose()
      },
      onError: (err) => {
        setError(err.message)
      },
    })
  }

  function handleClose() {
    setForm({ ...emptyForm })
    setConfirmPassword('')
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cadastrar Professor" maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dados Pessoais</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Nome completo *"
              value={form.nome_professor}
              onChange={(e) => onChange('nome_professor', e.target.value)}
            />
            <Input
              label="E-mail *"
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
            <Input
              label="CPF/CNPJ *"
              value={form.cpf_cnpj}
              onChange={(e) => onChange('cpf_cnpj', e.target.value)}
            />
            <Input
              label="Senha *"
              type="password"
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
            />
            <Input
              label="Confirmar senha *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Input
              label="Data de Nascimento"
              type="date"
              value={form.data_nascimento ?? ''}
              onChange={(e) => onChange('data_nascimento', e.target.value)}
            />
            <Input
              label="DDD"
              value={form.ddd ?? ''}
              onChange={(e) => onChange('ddd', e.target.value)}
              placeholder="11"
            />
            <Input
              label="Telefone"
              value={form.telefone}
              onChange={(e) => onChange('telefone', e.target.value)}
              placeholder="999999999"
            />
            <Input
              label="Disciplina"
              value={form.disciplina}
              onChange={(e) => onChange('disciplina', e.target.value)}
              placeholder="Ex: Direito Constitucional"
            />
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Endereço</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                CEP
                {cepLoading && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
              </label>
              <input
                value={form.cep ?? ''}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400">Preencha o CEP para autocompletar</p>
            </div>
            <Input
              label="Rua"
              value={form.rua ?? ''}
              onChange={(e) => onChange('rua', e.target.value)}
            />
            <Input
              label="Número"
              value={form.numero_casa_ap ?? ''}
              onChange={(e) => onChange('numero_casa_ap', e.target.value)}
            />
            <Input
              label="Bairro"
              value={form.bairro ?? ''}
              onChange={(e) => onChange('bairro', e.target.value)}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={form.estado ?? ''}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Selecione o estado</option>
                {estados.map((est) => (
                  <option key={est.id} value={est.nome}>{est.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Cidade</label>
              <select
                value={form.cidade ?? ''}
                onChange={(e) => onChange('cidade', e.target.value)}
                disabled={!form.estado}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{form.estado ? 'Selecione a cidade' : 'Selecione o estado primeiro'}</option>
                {(municipios ?? []).map((m) => (
                  <option key={m.id} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dados Bancários */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dados Bancários</h4>
          <p className="text-xs text-gray-400 mb-3">Preencha para registrar automaticamente no Pagar.me como recebedor.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Banco (código)"
              value={form.banco ?? ''}
              onChange={(e) => onChange('banco', e.target.value)}
              placeholder="341"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
              <select
                value={form.account_type ?? 'checking'}
                onChange={(e) => onChange('account_type', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="checking">Corrente</option>
                <option value="savings">Poupança</option>
              </select>
            </div>
            <Input
              label="Agência"
              value={form.agencia ?? ''}
              onChange={(e) => onChange('agencia', e.target.value)}
              placeholder="0000"
            />
            <Input
              label="Dígito Agência"
              value={form.digito_agencia ?? ''}
              onChange={(e) => onChange('digito_agencia', e.target.value)}
            />
            <Input
              label="Conta"
              value={form.conta ?? ''}
              onChange={(e) => onChange('conta', e.target.value)}
              placeholder="00000"
            />
            <Input
              label="Dígito Conta"
              value={form.digito_conta ?? ''}
              onChange={(e) => onChange('digito_conta', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
