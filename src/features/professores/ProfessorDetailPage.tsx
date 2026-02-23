import { useState, useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft, CheckCircle, XCircle, Trash2, Star, Save, Loader2,
  User, Image, Landmark, BookOpen, Users, MessageSquare, Ban, ShieldCheck, DollarSign,
} from 'lucide-react'
import {
  useProfessor, useProfessorCursos, useProfessorAvaliacoes,
  useUpdateProfessor, useUpdateProfessorStatus, useDeleteProfessor,
  useBlockProfessor, useUnblockProfessor,
} from './hooks'
import {
  useRecipientBalance, useTransferHistory, useRegisterRecipient, useRequestTransfer,
} from './payment-hooks'
import { useEstados, useMunicipiosByEstado } from '@/features/filtros/hooks'
import type { RegisterRecipientData } from './payment-api'
import type { ProfessorProfile, Avaliacao } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadFile } from '@/lib/storage'

const statusBadge: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  em_analise: { label: 'Em análise', variant: 'warning' },
  aprovado: { label: 'Aprovado', variant: 'success' },
  reprovado: { label: 'Reprovado', variant: 'danger' },
}

const TABS = [
  { key: 'dados', label: 'Dados Pessoais', icon: User },
  { key: 'fotos', label: 'Fotos e Descrição', icon: Image },
  { key: 'bancario', label: 'Dados Bancários', icon: Landmark },
  { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { key: 'cursos', label: 'Cursos', icon: BookOpen },
  { key: 'mentorias', label: 'Mentorias', icon: Users },
  { key: 'avaliacoes', label: 'Avaliações', icon: MessageSquare },
] as const

type TabKey = (typeof TABS)[number]['key']

export function ProfessorDetailPage() {
  const { professorId } = useParams({ strict: false }) as { professorId: string }
  const navigate = useNavigate()
  const { data: professor, isLoading } = useProfessor(professorId)
  const [activeTab, setActiveTab] = useState<TabKey>('dados')
  const [deleteModal, setDeleteModal] = useState(false)
  const [blockModal, setBlockModal] = useState(false)
  const updateStatus = useUpdateProfessorStatus()
  const deleteMutation = useDeleteProfessor()
  const blockMutation = useBlockProfessor()
  const unblockMutation = useUnblockProfessor()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!professor) {
    return (
      <div className="py-20 text-center text-gray-500">Professor não encontrado.</div>
    )
  }

  const badge = statusBadge[professor.approval_status ?? 'em_analise']
  const isBlocked = professor.is_blocked ?? false

  function handleDelete() {
    deleteMutation.mutate(professorId, {
      onSuccess: () => navigate({ to: '/professores' }),
    })
  }

  function handleBlock() {
    blockMutation.mutate(professorId, {
      onSuccess: () => setBlockModal(false),
    })
  }

  function handleUnblock() {
    unblockMutation.mutate(professorId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/professores' })}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {professor.foto_perfil ? (
            <img
              src={professor.foto_perfil}
              alt={professor.nome_professor}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xl">
              {professor.nome_professor.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{professor.nome_professor}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {isBlocked && <Badge variant="danger">Bloqueado</Badge>}
              {professor.disciplina && (
                <span className="text-sm text-gray-500">{professor.disciplina}</span>
              )}
              {professor.average_rating && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  {Number(professor.average_rating).toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {professor.approval_status !== 'aprovado' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateStatus.mutate({ id: professorId, status: 'aprovado' })}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="mr-1.5 h-4 w-4 text-green-600" />
              Aprovar
            </Button>
          )}
          {professor.approval_status !== 'reprovado' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateStatus.mutate({ id: professorId, status: 'reprovado' })}
              disabled={updateStatus.isPending}
            >
              <XCircle className="mr-1.5 h-4 w-4 text-red-600" />
              Reprovar
            </Button>
          )}
          {isBlocked ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUnblock}
              disabled={unblockMutation.isPending}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4 text-green-600" />
              {unblockMutation.isPending ? 'Desbloqueando...' : 'Desbloquear'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBlockModal(true)}
            >
              <Ban className="mr-1.5 h-4 w-4 text-orange-600" />
              Bloquear
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {activeTab === 'dados' && <TabDadosPessoais professor={professor} />}
        {activeTab === 'fotos' && <TabFotosDescricao professor={professor} />}
        {activeTab === 'bancario' && <TabDadosBancarios professor={professor} />}
        {activeTab === 'financeiro' && <TabFinanceiro professor={professor} />}
        {activeTab === 'cursos' && <TabCursos professorId={professorId} />}
        {activeTab === 'mentorias' && <TabMentorias professor={professor} />}
        {activeTab === 'avaliacoes' && <TabAvaliacoes professorId={professorId} />}
      </div>

      {/* Block modal */}
      <Modal open={blockModal} onClose={() => setBlockModal(false)} title="Bloquear Professor">
        <p className="text-sm text-gray-600">
          Tem certeza que deseja bloquear <strong>{professor.nome_professor}</strong>? O professor não conseguirá mais acessar a plataforma.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBlockModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleBlock}
            disabled={blockMutation.isPending}
          >
            {blockMutation.isPending ? 'Bloqueando...' : 'Bloquear'}
          </Button>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir Professor">
        <p className="text-sm text-gray-600">
          Tem certeza que deseja excluir <strong>{professor.nome_professor}</strong>? O acesso será revogado e o professor ficará inativo.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/* ───── Tab: Dados Pessoais ───── */

function TabDadosPessoais({ professor }: { professor: ProfessorProfile }) {
  const updateProfessor = useUpdateProfessor()
  const [form, setForm] = useState({
    nome_professor: professor.nome_professor,
    email: professor.email ?? '',
    telefone: professor.telefone ?? '',
    cpf_cnpj: professor.cpf_cnpj ?? '',
    data_nascimento: professor.data_nascimento ?? '',
    rua: professor.rua ?? '',
    numero_casa_ap: professor.numero_casa_ap ?? '',
    bairro: professor.bairro ?? '',
    cidade: professor.cidade ?? '',
    estado: professor.estado ?? '',
  })

  function onChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    updateProfessor.mutate({ id: professor.id, ...form })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" value={form.nome_professor} onChange={(e) => onChange('nome_professor', e.target.value)} />
        <Input label="E-mail" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
        <Input label="Telefone" value={form.telefone} onChange={(e) => onChange('telefone', e.target.value)} />
        <Input label="CPF/CNPJ" value={form.cpf_cnpj} onChange={(e) => onChange('cpf_cnpj', e.target.value)} />
        <Input label="Data de Nascimento" type="date" value={form.data_nascimento} onChange={(e) => onChange('data_nascimento', e.target.value)} />
      </div>
      <h3 className="text-sm font-semibold text-gray-700">Endereço</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Rua" value={form.rua} onChange={(e) => onChange('rua', e.target.value)} />
        <Input label="Número/Apto" value={form.numero_casa_ap} onChange={(e) => onChange('numero_casa_ap', e.target.value)} />
        <Input label="Bairro" value={form.bairro} onChange={(e) => onChange('bairro', e.target.value)} />
        <Input label="Cidade" value={form.cidade} onChange={(e) => onChange('cidade', e.target.value)} />
        <Input label="Estado" value={form.estado} onChange={(e) => onChange('estado', e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfessor.isPending}>
          {updateProfessor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  )
}

/* ───── Tab: Fotos e Descrição ───── */

function TabFotosDescricao({ professor }: { professor: ProfessorProfile }) {
  const updateProfessor = useUpdateProfessor()
  const [form, setForm] = useState({
    foto_perfil: professor.foto_perfil ?? '',
    foto_capa: professor.foto_capa ?? '',
    biografia: professor.biografia ?? '',
    disciplina: professor.disciplina ?? '',
    instagram: professor.instagram ?? '',
    facebook: professor.facebook ?? '',
    youtube: professor.youtube ?? '',
    tiktok: professor.tiktok ?? '',
  })

  function onChange(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  function handleSave() {
    updateProfessor.mutate({
      id: professor.id,
      ...form,
      foto_perfil: form.foto_perfil || null,
      foto_capa: form.foto_capa || null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FileUpload
          label="Foto de Perfil"
          accept="image/*"
          value={form.foto_perfil || null}
          onChange={(url) => onChange('foto_perfil', url)}
          onUpload={(file) => uploadFile('professores', file, 'perfil')}
        />
        <FileUpload
          label="Foto de Capa"
          accept="image/*"
          value={form.foto_capa || null}
          onChange={(url) => onChange('foto_capa', url)}
          onUpload={(file) => uploadFile('professores', file, 'capa')}
        />
      </div>
      <Input label="Disciplina" value={form.disciplina} onChange={(e) => onChange('disciplina', e.target.value)} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Biografia</label>
        <textarea
          value={form.biografia}
          onChange={(e) => onChange('biografia', e.target.value)}
          rows={4}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <h3 className="text-sm font-semibold text-gray-700">Redes Sociais</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Instagram" value={form.instagram} onChange={(e) => onChange('instagram', e.target.value)} placeholder="@usuario" />
        <Input label="Facebook" value={form.facebook} onChange={(e) => onChange('facebook', e.target.value)} placeholder="URL" />
        <Input label="YouTube" value={form.youtube} onChange={(e) => onChange('youtube', e.target.value)} placeholder="URL" />
        <Input label="TikTok" value={form.tiktok} onChange={(e) => onChange('tiktok', e.target.value)} placeholder="@usuario" />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfessor.isPending}>
          {updateProfessor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  )
}

/* ───── Tab: Dados Bancários (somente leitura) ───── */

function TabDadosBancarios({ professor }: { professor: ProfessorProfile }) {
  const fields = [
    { label: 'Banco', value: professor.banco },
    { label: 'Agência', value: professor.agencia },
    { label: 'Dígito Agência', value: professor.digito_agencia },
    { label: 'Conta', value: professor.conta },
    { label: 'Dígito Conta', value: professor.digito_conta },
    { label: 'Chave PIX', value: professor.chave_pix },
    { label: 'Receiver ID (Pagar.me)', value: professor.pagarme_receiver_id },
  ]

  return (
    <div className="space-y-1">
      <p className="mb-4 text-sm text-gray-500">Dados bancários são somente leitura.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-xs font-medium text-gray-500">{f.label}</p>
            <p className="mt-0.5 text-sm text-gray-900">{f.value || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───── Tab: Financeiro ───── */

function TabFinanceiro({ professor }: { professor: ProfessorProfile }) {
  const recipientId = professor.pagarme_receiver_id
  const [registerModal, setRegisterModal] = useState(false)

  if (!recipientId) {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-sm text-gray-500">
          Este professor ainda não está registrado como recebedor no Pagar.me.
        </p>
        <Button onClick={() => setRegisterModal(true)}>
          <DollarSign className="mr-2 h-4 w-4" />
          Registrar como Recebedor
        </Button>
        {registerModal && (
          <RegisterRecipientModal
            professor={professor}
            onClose={() => setRegisterModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BalanceCards recipientId={recipientId} />
      <TransferForm recipientId={recipientId} />
      <TransferHistory recipientId={recipientId} />
    </div>
  )
}

function BalanceCards({ recipientId }: { recipientId: string }) {
  const { data: balance, isLoading } = useRecipientBalance(recipientId)

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  const cards = [
    { label: 'Disponível', value: balance?.available_amount ?? 0, color: 'text-green-600' },
    { label: 'Aguardando', value: balance?.waiting_funds_amount ?? 0, color: 'text-yellow-600' },
    { label: 'Transferido', value: balance?.transferred_amount ?? 0, color: 'text-blue-600' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500">{card.label}</p>
          <p className={`mt-1 text-xl font-semibold ${card.color}`}>
            R$ {(card.value / 100).toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  )
}

function TransferForm({ recipientId }: { recipientId: string }) {
  const [amount, setAmount] = useState('')
  const transferMutation = useRequestTransfer()

  function handleTransfer() {
    const cents = Math.round(parseFloat(amount) * 100)
    if (!cents || cents <= 0) return
    transferMutation.mutate(
      { recipientId, amount: cents },
      { onSuccess: () => setAmount('') },
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Solicitar Transferência</h3>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <Button
          onClick={handleTransfer}
          disabled={transferMutation.isPending || !amount || parseFloat(amount) <= 0}
        >
          {transferMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DollarSign className="mr-2 h-4 w-4" />
          )}
          Transferir
        </Button>
      </div>
      {transferMutation.isError && (
        <p className="mt-2 text-sm text-red-600">{transferMutation.error.message}</p>
      )}
      {transferMutation.isSuccess && (
        <p className="mt-2 text-sm text-green-600">Transferência solicitada com sucesso.</p>
      )}
    </div>
  )
}

function TransferHistory({ recipientId }: { recipientId: string }) {
  const { data: transfers, isLoading } = useTransferHistory(recipientId)

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  if (!transfers?.length) {
    return <p className="py-4 text-center text-sm text-gray-400">Nenhuma transferência realizada.</p>
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    transferred: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Histórico de Transferências</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Data</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Valor</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transfers.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 text-gray-700">
                  {new Date(t.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-2 text-gray-900 font-medium">
                  R$ {Number(t.amount).toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-400 text-xs font-mono">
                  {t.pagarme_transfer_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RegisterRecipientModal({
  professor,
  onClose,
}: {
  professor: ProfessorProfile
  onClose: () => void
}) {
  const registerMutation = useRegisterRecipient()
  const { data: estadosData } = useEstados()
  const allEstados = estadosData?.items ?? []
  const [form, setForm] = useState({
    type: 'individual' as 'individual' | 'company',
    document: professor.cpf_cnpj ?? '',
    name: professor.nome_professor,
    email: professor.email ?? '',
    ddd: '',
    phone: '',
    birthdate: professor.data_nascimento ?? '',
    monthly_income: '',
    zip_code: '',
    street: professor.rua ?? '',
    number: professor.numero_casa_ap ?? '',
    complement: '',
    neighborhood: professor.bairro ?? '',
    city: professor.cidade ?? '',
    state: professor.estado ?? '',
    bank: professor.banco ?? '',
    branch_number: professor.agencia ?? '',
    branch_check_digit: professor.digito_agencia ?? '',
    account_number: professor.conta ?? '',
    account_check_digit: professor.digito_conta ?? '',
    account_type: 'checking' as 'checking' | 'savings',
  })

  const selectedEstadoId = allEstados.find((e) => e.nome === form.state)?.id
  const { data: municipios } = useMunicipiosByEstado(selectedEstadoId)

  function onChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleEstadoChange(estadoNome: string) {
    setForm((prev) => ({ ...prev, state: estadoNome, city: '' }))
  }

  const fetchViaCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) return
      const estadoMatch = allEstados.find((e) => e.uf === data.uf)
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: estadoMatch?.nome ?? prev.state,
      }))
    } catch { /* ignore */ }
  }, [allEstados])

  function handleCepChange(value: string) {
    onChange('zip_code', value)
    const digits = value.replace(/\D/g, '')
    if (digits.length === 8) fetchViaCep(digits)
  }

  function handleSubmit() {
    const data: RegisterRecipientData = {
      professor_id: professor.id,
      type: form.type,
      name: form.name,
      email: form.email,
      document: form.document,
      phone: {
        country_code: '55',
        area_code: form.ddd,
        number: form.phone,
      },
      birthdate: form.birthdate || undefined,
      monthly_income: form.monthly_income ? parseInt(form.monthly_income) : undefined,
      address: {
        street: form.street,
        number: form.number,
        complement: form.complement || undefined,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        country: 'BR',
      },
      bank_account: {
        bank: form.bank,
        branch_number: form.branch_number,
        branch_check_digit: form.branch_check_digit || undefined,
        account_number: form.account_number,
        account_check_digit: form.account_check_digit,
        type: form.account_type,
        holder_name: form.name,
        holder_document: form.document,
        holder_type: form.type,
      },
    }

    registerMutation.mutate(data, { onSuccess: onClose })
  }

  return (
    <Modal open onClose={onClose} title="Registrar Recebedor Pagar.me">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => onChange('type', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="individual">Pessoa Física</option>
              <option value="company">Pessoa Jurídica</option>
            </select>
          </div>
          <Input label="CPF/CNPJ" value={form.document} onChange={(e) => onChange('document', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
          <Input label="E-mail" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="DDD" value={form.ddd} onChange={(e) => onChange('ddd', e.target.value)} placeholder="11" />
          <Input label="Telefone" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="999999999" />
          <Input label="Data de Nascimento" type="date" value={form.birthdate} onChange={(e) => onChange('birthdate', e.target.value)} />
        </div>
        <Input label="Renda Mensal (centavos)" value={form.monthly_income} onChange={(e) => onChange('monthly_income', e.target.value)} placeholder="500000" />

        <h3 className="text-sm font-semibold text-gray-700 pt-2">Endereço</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="CEP" value={form.zip_code} onChange={(e) => handleCepChange(e.target.value)} />
          <Input label="Rua" value={form.street} onChange={(e) => onChange('street', e.target.value)} />
          <Input label="Número" value={form.number} onChange={(e) => onChange('number', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Complemento" value={form.complement} onChange={(e) => onChange('complement', e.target.value)} />
          <Input label="Bairro" value={form.neighborhood} onChange={(e) => onChange('neighborhood', e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              value={form.state}
              onChange={(e) => handleEstadoChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Selecione o estado</option>
              {allEstados.map((est) => (
                <option key={est.id} value={est.nome}>{est.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Cidade</label>
          <select
            value={form.city}
            onChange={(e) => onChange('city', e.target.value)}
            disabled={!form.state}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">{form.state ? 'Selecione a cidade' : 'Selecione o estado primeiro'}</option>
            {(municipios ?? []).map((m) => (
              <option key={m.id} value={m.nome}>{m.nome}</option>
            ))}
          </select>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 pt-2">Conta Bancária</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Banco (código)" value={form.bank} onChange={(e) => onChange('bank', e.target.value)} placeholder="341" />
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
            <select
              value={form.account_type}
              onChange={(e) => onChange('account_type', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="checking">Corrente</option>
              <option value="savings">Poupança</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Agência" value={form.branch_number} onChange={(e) => onChange('branch_number', e.target.value)} />
          <Input label="Dígito Agência" value={form.branch_check_digit} onChange={(e) => onChange('branch_check_digit', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Conta" value={form.account_number} onChange={(e) => onChange('account_number', e.target.value)} />
          <Input label="Dígito Conta" value={form.account_check_digit} onChange={(e) => onChange('account_check_digit', e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
        <Button size="sm" onClick={handleSubmit} disabled={registerMutation.isPending}>
          {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
          Registrar
        </Button>
      </div>
      {registerMutation.isError && (
        <p className="mt-2 text-sm text-red-600">{registerMutation.error.message}</p>
      )}
    </Modal>
  )
}

/* ───── Tab: Cursos (somente leitura) ───── */

function TabCursos({ professorId }: { professorId: string }) {
  const { data: cursos, isLoading } = useProfessorCursos(professorId)

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  if (!cursos?.length) {
    return <p className="py-8 text-center text-sm text-gray-400">Nenhum curso cadastrado.</p>
  }

  return (
    <div className="space-y-1">
      <p className="mb-4 text-sm text-gray-500">Cursos são gerenciados pelo professor. Visualização somente leitura.</p>
      <div className="divide-y divide-gray-100">
        {cursos.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">{c.nome}</p>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
                <span>{c.preco ? `R$ ${Number(c.preco).toFixed(2)}` : 'Grátis'}</span>
                {c.average_rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {Number(c.average_rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <Badge variant={c.is_publicado ? 'success' : 'warning'}>
              {c.is_publicado ? 'Publicado' : 'Rascunho'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───── Tab: Mentorias ───── */

function TabMentorias({ professor }: { professor: ProfessorProfile }) {
  const updateProfessor = useUpdateProfessor()
  const [descricaoMentorias, setDescricaoMentorias] = useState(professor.descricao_mentorias ?? '')
  const [contemMentoria, setContemMentoria] = useState((professor.contem_mentoria ?? []).join(', '))

  function handleSave() {
    const mentorias = contemMentoria.split(',').map((s) => s.trim()).filter(Boolean)
    updateProfessor.mutate({
      id: professor.id,
      descricao_mentorias: descricaoMentorias || null,
      contem_mentoria: mentorias.length ? mentorias : null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Descrição das Mentorias</label>
        <textarea
          value={descricaoMentorias}
          onChange={(e) => setDescricaoMentorias(e.target.value)}
          rows={4}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <Input
        label="Tipos de Mentoria (separados por vírgula)"
        value={contemMentoria}
        onChange={(e) => setContemMentoria(e.target.value)}
        placeholder="Individual, Grupo, Online..."
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfessor.isPending}>
          {updateProfessor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  )
}

/* ───── Tab: Avaliações (somente leitura) ───── */

function TabAvaliacoes({ professorId }: { professorId: string }) {
  const { data: avaliacoes, isLoading } = useProfessorAvaliacoes(professorId)

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  if (!avaliacoes?.length) {
    return <p className="py-8 text-center text-sm text-gray-400">Nenhuma avaliação recebida.</p>
  }

  return (
    <div className="space-y-1">
      <p className="mb-4 text-sm text-gray-500">Avaliações dos alunos. Somente leitura.</p>
      <div className="divide-y divide-gray-100">
        {avaliacoes.map((av) => (
          <AvaliacaoItem key={av.id} avaliacao={av} />
        ))}
      </div>
    </div>
  )
}

function AvaliacaoItem({ avaliacao }: { avaliacao: Avaliacao }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avaliacao.foto_aluno ? (
            <img src={avaliacao.foto_aluno} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
              {(avaliacao.profiles?.display_name ?? avaliacao.profiles?.email ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {avaliacao.profiles?.display_name ?? avaliacao.profiles?.email ?? 'Aluno'}
            </p>
            {avaliacao.cursos?.nome && (
              <p className="text-xs text-gray-500">{avaliacao.cursos.nome}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < avaliacao.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
      </div>
      {avaliacao.comentario && (
        <p className="mt-2 text-sm text-gray-600">{avaliacao.comentario}</p>
      )}
      {avaliacao.created_at && (
        <p className="mt-1 text-xs text-gray-400">
          {new Date(avaliacao.created_at).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  )
}
