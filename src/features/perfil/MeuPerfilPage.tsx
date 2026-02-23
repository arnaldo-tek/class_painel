import { useState, useEffect, type FormEvent } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfessorProfile } from '@/hooks/useProfile'
import { useUpdateProfessorProfile } from './hooks'
import { uploadFile } from '@/lib/storage'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type TabKey = 'dados' | 'fotos' | 'bancario'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dados', label: 'Dados Pessoais' },
  { key: 'fotos', label: 'Fotos e Descrição' },
  { key: 'bancario', label: 'Dados Bancários' },
]

export function MeuPerfilPage() {
  const { user } = useAuthContext()
  const { data: profile, isLoading } = useProfessorProfile(user?.id)
  const [activeTab, setActiveTab] = useState<TabKey>('dados')

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">Perfil de professor não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dados' && <TabDadosPessoais profile={profile} email={user?.email ?? ''} />}
      {activeTab === 'fotos' && <TabFotosDescricao profile={profile} />}
      {activeTab === 'bancario' && <TabDadosBancarios profile={profile} />}
    </div>
  )
}

// ─── Tab Dados Pessoais ──────────────────────────────────────────────────────

function TabDadosPessoais({ profile, email }: { profile: Record<string, unknown>; email: string }) {
  const updateMutation = useUpdateProfessorProfile()
  const [form, setForm] = useState({
    nome_professor: (profile.nome_professor as string) ?? '',
    telefone: (profile.telefone as string) ?? '',
    cpf_cnpj: (profile.cpf_cnpj as string) ?? '',
    data_nascimento: (profile.data_nascimento as string) ?? '',
    rua: (profile.rua as string) ?? '',
    numero: (profile.numero as string) ?? '',
    bairro: (profile.bairro as string) ?? '',
    cidade: (profile.cidade as string) ?? '',
    estado: (profile.estado as string) ?? '',
  })
  const [success, setSuccess] = useState(false)

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await updateMutation.mutateAsync({ id: profile.id as string, ...form })
    setSuccess(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" value={form.nome_professor} onChange={(v) => handleChange('nome_professor', v)} />
        <Field label="Email" value={email} onChange={() => {}} disabled />
        <Field label="Telefone" value={form.telefone} onChange={(v) => handleChange('telefone', v)} />
        <Field label="CPF/CNPJ" value={form.cpf_cnpj} onChange={(v) => handleChange('cpf_cnpj', v)} />
        <Field label="Data de Nascimento" value={form.data_nascimento} onChange={(v) => handleChange('data_nascimento', v)} type="date" />
      </div>

      <h3 className="text-sm font-semibold text-gray-700 pt-2">Endereço</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rua" value={form.rua} onChange={(v) => handleChange('rua', v)} />
        <Field label="Número" value={form.numero} onChange={(v) => handleChange('numero', v)} />
        <Field label="Bairro" value={form.bairro} onChange={(v) => handleChange('bairro', v)} />
        <Field label="Cidade" value={form.cidade} onChange={(v) => handleChange('cidade', v)} />
        <Field label="Estado" value={form.estado} onChange={(v) => handleChange('estado', v)} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        {success && <span className="text-sm text-emerald-600">Salvo com sucesso!</span>}
        {updateMutation.isError && <span className="text-sm text-red-600">Erro ao salvar.</span>}
      </div>
    </form>
  )
}

// ─── Tab Fotos e Descrição ───────────────────────────────────────────────────

function TabFotosDescricao({ profile }: { profile: Record<string, unknown> }) {
  const updateMutation = useUpdateProfessorProfile()
  const [form, setForm] = useState({
    foto_perfil: (profile.foto_perfil as string) ?? '',
    foto_capa: (profile.foto_capa as string) ?? '',
    biografia: (profile.biografia as string) ?? '',
    disciplina: (profile.disciplina as string) ?? '',
    instagram: (profile.instagram as string) ?? '',
    facebook: (profile.facebook as string) ?? '',
    youtube: (profile.youtube as string) ?? '',
    tiktok: (profile.tiktok as string) ?? '',
  })
  const [success, setSuccess] = useState(false)

  function handleChange(field: string, value: string | null) {
    setForm((f) => ({ ...f, [field]: value ?? '' }))
    setSuccess(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await updateMutation.mutateAsync({ id: profile.id as string, ...form })
    setSuccess(true)
  }

  async function handleUpload(file: File, folder: string) {
    return uploadFile('professores', file, folder)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FileUpload
          label="Foto de Perfil"
          accept="image/*"
          value={form.foto_perfil || null}
          onChange={(url) => handleChange('foto_perfil', url)}
          onUpload={(file) => handleUpload(file, 'perfil')}
          type="image"
        />
        <FileUpload
          label="Foto de Capa"
          accept="image/*"
          value={form.foto_capa || null}
          onChange={(url) => handleChange('foto_capa', url)}
          onUpload={(file) => handleUpload(file, 'capas')}
          type="image"
        />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Biografia</label>
          <textarea
            value={form.biografia}
            onChange={(e) => handleChange('biografia', e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Field label="Disciplina" value={form.disciplina} onChange={(v) => handleChange('disciplina', v)} />
      </div>

      <h3 className="text-sm font-semibold text-gray-700 pt-2">Redes Sociais</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram" value={form.instagram} onChange={(v) => handleChange('instagram', v)} placeholder="@usuario" />
        <Field label="Facebook" value={form.facebook} onChange={(v) => handleChange('facebook', v)} />
        <Field label="YouTube" value={form.youtube} onChange={(v) => handleChange('youtube', v)} />
        <Field label="TikTok" value={form.tiktok} onChange={(v) => handleChange('tiktok', v)} placeholder="@usuario" />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        {success && <span className="text-sm text-emerald-600">Salvo com sucesso!</span>}
        {updateMutation.isError && <span className="text-sm text-red-600">Erro ao salvar.</span>}
      </div>
    </form>
  )
}

// ─── Tab Dados Bancários ─────────────────────────────────────────────────────

function TabDadosBancarios({ profile }: { profile: Record<string, unknown> }) {
  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">
        Os dados bancários são apenas para consulta. Para alterações, entre em contato com o suporte.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadonlyField label="Banco" value={profile.banco as string} />
        <ReadonlyField label="Agência" value={profile.agencia as string} />
        <ReadonlyField label="Dígito Agência" value={profile.digito_agencia as string} />
        <ReadonlyField label="Conta" value={profile.conta as string} />
        <ReadonlyField label="Dígito Conta" value={profile.digito_conta as string} />
        <ReadonlyField label="Chave PIX" value={profile.chave_pix as string} />
      </div>
    </div>
  )
}

// ─── Shared components ───────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', disabled = false, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        {value || '—'}
      </div>
    </div>
  )
}
