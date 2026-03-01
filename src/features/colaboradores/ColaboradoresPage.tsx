import { useState, useCallback, useEffect } from 'react'
import { UserCog, Plus, Trash2, Pencil, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useColaboradores, useCreateColaborador, useUpdateColaborador, useDeleteColaborador } from './hooks'
import { useEstados, useMunicipiosByEstado } from '@/features/filtros/hooks'
import { ADMIN_PERMISSIONS, type AdminPermission } from '@/types/enums'
import type { Colaborador, ColaboradorFormData } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'

const PERMISSION_LABELS: Record<string, string> = {
  manage_categories: 'Categorias',
  manage_packages: 'Pacotes',
  manage_courses: 'Cursos',
  manage_news: 'Notícias',
  manage_editais: 'Editais',
  manage_professor_support: 'Suporte Professores',
  manage_student_support: 'Suporte Alunos',
  view_sales: 'Vendas',
  manage_colaboradores: 'Colaboradores',
  manage_students: 'Alunos',
  manage_professors: 'Professores',
  manage_tutorials: 'Tutoriais',
  manage_documents: 'Documentos',
  manage_advertising: 'Publicidade',
  manage_audiocourses: 'Audio Cursos',
  manage_communities: 'Comunidades',
  manage_coupons: 'Cupons',
  manage_faq: 'FAQ',
}

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function maskCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

const emptyForm: ColaboradorFormData = {
  email: '',
  password: '',
  display_name: '',
  phone_number: '',
  cpf: '',
  endereco: '',
  numero: '',
  complemento: '',
  cep: '',
  cidade: '',
  estado: '',
  banco: '',
  agencia: '',
  conta: '',
  digito_opcional: '',
  chave_pix: '',
  permissions: [],
}

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function ColaboradoresPage() {
  const { data: colaboradores, isLoading } = useColaboradores()
  const [showForm, setShowForm] = useState(false)
  const [editingColab, setEditingColab] = useState<Colaborador | null>(null)

  function handleAdd() {
    setEditingColab(null)
    setShowForm(true)
  }

  function handleEdit(colab: Colaborador) {
    setEditingColab(colab)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingColab(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Colaborador
        </Button>
      </div>

      <ColaboradorFormModal
        open={showForm}
        colaborador={editingColab}
        onClose={handleCloseForm}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !colaboradores?.length ? (
        <EmptyState
          icon={<UserCog className="h-12 w-12" />}
          title="Nenhum colaborador"
          description="Adicione colaboradores e defina suas permissões."
        />
      ) : (
        <div className="space-y-3">
          {colaboradores.map((colab) => (
            <ColaboradorCard
              key={colab.user_id}
              colaborador={colab}
              onEdit={() => handleEdit(colab)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ColaboradorFormModal({
  open,
  colaborador,
  onClose,
}: {
  open: boolean
  colaborador: Colaborador | null
  onClose: () => void
}) {
  const isEdit = !!colaborador
  const createMutation = useCreateColaborador()
  const updateMutation = useUpdateColaborador()

  // Estados e municípios do banco
  const { data: estadosData } = useEstados()
  const estados = estadosData?.items ?? []

  const [form, setForm] = useState<ColaboradorFormData>({ ...emptyForm })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [cepLoading, setCepLoading] = useState(false)

  // Reset form when colaborador changes or modal opens
  useEffect(() => {
    if (!open) return
    if (colaborador) {
      setForm({
        email: colaborador.email,
        display_name: colaborador.display_name ?? '',
        phone_number: colaborador.phone_number ?? '',
        cpf: colaborador.cpf ?? '',
        endereco: colaborador.endereco ?? '',
        numero: colaborador.numero ?? '',
        complemento: colaborador.complemento ?? '',
        cep: colaborador.cep ?? '',
        cidade: colaborador.cidade ?? '',
        estado: colaborador.estado ?? '',
        banco: colaborador.banco ?? '',
        agencia: colaborador.agencia ?? '',
        conta: colaborador.conta ?? '',
        digito_opcional: colaborador.digito_opcional ?? '',
        chave_pix: colaborador.chave_pix ?? '',
        permissions: colaborador.permissions as AdminPermission[],
      })
    } else {
      setForm({ ...emptyForm })
    }
    setConfirmPassword('')
    setError('')
  }, [open, colaborador])

  // Encontra o ID do estado selecionado para buscar municípios
  const selectedEstadoId = estados.find((e) => e.nome === form.estado)?.id
  const { data: municipios } = useMunicipiosByEstado(selectedEstadoId)

  function setField<K extends keyof ColaboradorFormData>(key: K, value: ColaboradorFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function togglePermission(perm: AdminPermission) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }))
  }

  const fetchViaCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return

    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data: ViaCepResponse = await res.json()
      if (data.erro) return

      const estadoMatch = estados.find((e) => e.uf === data.uf)
      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        complemento: data.complemento || prev.complemento,
        estado: estadoMatch?.nome ?? prev.estado,
        cidade: data.localidade || prev.cidade,
      }))
    } catch {
      // silently fail
    } finally {
      setCepLoading(false)
    }
  }, [estados])

  function handleCepChange(value: string) {
    const masked = maskCEP(value)
    setField('cep', masked)
    const digits = value.replace(/\D/g, '')
    if (digits.length === 8) {
      fetchViaCep(digits)
    }
  }

  function handleEstadoChange(estadoNome: string) {
    setField('estado', estadoNome)
    setField('cidade', '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.display_name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    if (!form.email.trim()) {
      setError('E-mail é obrigatório')
      return
    }

    if (!isEdit) {
      if (!form.password || form.password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres')
        return
      }
      if (form.password !== confirmPassword) {
        setError('As senhas não conferem')
        return
      }
    }

    try {
      if (isEdit) {
        const { email, password, ...data } = form
        await updateMutation.mutateAsync({ userId: colaborador!.user_id, ...data })
      } else {
        await createMutation.mutateAsync(form)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Colaborador' : 'Novo Colaborador'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dados Pessoais</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Nome *"
              value={form.display_name}
              onChange={(e) => setField('display_name', e.target.value)}
              placeholder="Nome completo"
              required
            />
            <Input
              label="CPF"
              value={form.cpf}
              onChange={(e) => setField('cpf', maskCPF(e.target.value))}
              placeholder="000.000.000-00"
            />
            <Input
              label="Telefone"
              value={form.phone_number}
              onChange={(e) => setField('phone_number', maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
            <Input
              label="E-mail *"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="email@exemplo.com"
              required
              disabled={isEdit}
            />
            {!isEdit && (
              <>
                <Input
                  label="Senha *"
                  type="password"
                  value={form.password ?? ''}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <Input
                  label="Confirmar Senha *"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir senha"
                  required
                />
              </>
            )}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                CEP
                {cepLoading && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
              </label>
              <input
                value={form.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400">Preencha o CEP para autocompletar o endereço</p>
            </div>
            <Input
              label="Endereço"
              value={form.endereco}
              onChange={(e) => setField('endereco', e.target.value)}
              placeholder="Rua, Avenida..."
            />
            <Input
              label="Número"
              value={form.numero}
              onChange={(e) => setField('numero', e.target.value)}
              placeholder="Nº"
            />
            <Input
              label="Complemento"
              value={form.complemento}
              onChange={(e) => setField('complemento', e.target.value)}
              placeholder="Apto, Bloco..."
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={form.estado}
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
                value={form.cidade}
                onChange={(e) => setField('cidade', e.target.value)}
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Banco"
              value={form.banco}
              onChange={(e) => setField('banco', e.target.value)}
              placeholder="Nome do banco"
            />
            <Input
              label="Agência"
              value={form.agencia}
              onChange={(e) => setField('agencia', e.target.value)}
              placeholder="0000"
            />
            <Input
              label="Conta"
              value={form.conta}
              onChange={(e) => setField('conta', e.target.value)}
              placeholder="00000-0"
            />
            <Input
              label="Operação"
              value={form.digito_opcional}
              onChange={(e) => setField('digito_opcional', e.target.value.replace(/\D/g, '').slice(0, 1))}
              placeholder="0"
              maxLength={1}
            />
            <Input
              label="Chave PIX"
              value={form.chave_pix}
              onChange={(e) => setField('chave_pix', e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="sm:col-span-2"
            />
          </div>
        </div>

        {/* Permissões */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Permissões</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{PERMISSION_LABELS[perm] ?? perm}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Colaborador'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ColaboradorCard({
  colaborador,
  onEdit,
}: {
  colaborador: Colaborador
  onEdit: () => void
}) {
  const deleteMutation = useDeleteColaborador()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{colaborador.display_name ?? colaborador.email}</p>
          <p className="text-sm text-gray-500 truncate">{colaborador.email}</p>
        </div>
        <Badge>{colaborador.permissions.length} permissões</Badge>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
          title="Ver detalhes"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100" title="Editar">
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Excluir colaborador "${colaborador.display_name ?? colaborador.email}"? Esta ação também remove a conta do usuário.`)) {
              deleteMutation.mutate(colaborador.user_id)
            }
          }}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            {colaborador.cpf && <Detail label="CPF" value={colaborador.cpf} />}
            {colaborador.phone_number && <Detail label="Telefone" value={colaborador.phone_number} />}
            {colaborador.endereco && (
              <Detail
                label="Endereço"
                value={[colaborador.endereco, colaborador.numero, colaborador.complemento].filter(Boolean).join(', ')}
              />
            )}
            {colaborador.cep && <Detail label="CEP" value={colaborador.cep} />}
            {colaborador.cidade && <Detail label="Cidade" value={colaborador.cidade} />}
            {colaborador.estado && <Detail label="Estado" value={colaborador.estado} />}
            {colaborador.banco && <Detail label="Banco" value={colaborador.banco} />}
            {colaborador.agencia && <Detail label="Agência" value={colaborador.agencia} />}
            {colaborador.conta && <Detail label="Conta" value={colaborador.conta} />}
            {colaborador.chave_pix && <Detail label="PIX" value={colaborador.chave_pix} />}
          </div>
          {colaborador.permissions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Permissões:</p>
              <div className="flex flex-wrap gap-1">
                {colaborador.permissions.map((p) => (
                  <Badge key={p}>{PERMISSION_LABELS[p] ?? p}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{' '}
      <span className="text-gray-900">{value}</span>
    </div>
  )
}
