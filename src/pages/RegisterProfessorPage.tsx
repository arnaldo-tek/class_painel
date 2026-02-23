import { useState, useCallback, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

interface RegisterForm {
  nome_professor: string
  email: string
  password: string
  cpf_cnpj: string
  telefone: string
  ddd: string
  disciplina: string
  data_nascimento: string
  rua: string
  numero_casa_ap: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  banco: string
  agencia: string
  digito_agencia: string
  conta: string
  digito_conta: string
  account_type: 'checking' | 'savings'
}

const emptyForm: RegisterForm = {
  nome_professor: '',
  email: '',
  password: '',
  cpf_cnpj: '',
  telefone: '',
  ddd: '',
  disciplina: '',
  data_nascimento: '',
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
  account_type: 'checking',
}

export function RegisterProfessorPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>({ ...emptyForm })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [cepLoading, setCepLoading] = useState(false)

  function onChange(field: keyof RegisterForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const fetchViaCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) return
      setForm((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }))
    } catch { /* ignore */ } finally {
      setCepLoading(false)
    }
  }, [])

  function handleCepChange(value: string) {
    onChange('cep', value)
    const digits = value.replace(/\D/g, '')
    if (digits.length === 8) fetchViaCep(digits)
  }

  function validateStep1() {
    if (!form.nome_professor.trim()) return 'Nome é obrigatório'
    if (!form.email.trim()) return 'E-mail é obrigatório'
    if (!form.cpf_cnpj.trim()) return 'CPF/CNPJ é obrigatório'
    if (!form.password || form.password.length < 6) return 'Senha deve ter no mínimo 6 caracteres'
    if (form.password !== confirmPassword) return 'As senhas não coincidem'
    return null
  }

  function handleNextStep() {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('register-professor', {
        body: form,
      })
      if (fnError) throw new Error(fnError.message)
      if (result?.error) throw new Error(result.error)

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <nav className="relative z-20 flex items-center gap-3 px-6 py-4 sm:px-10">
          <img src="/icon.png" alt="" className="h-9 w-9 rounded-xl" />
          <span className="text-xl font-bold text-white tracking-tight">Superclasse</span>
        </nav>
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro realizado!</h2>
            <p className="text-gray-500 mb-6">
              Seu cadastro foi enviado para análise. Você receberá um e-mail quando for aprovado.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
      {/* Navbar */}
      <nav className="relative z-20 flex items-center gap-3 px-6 py-4 sm:px-10">
        <img src="/icon.png" alt="" className="h-9 w-9 rounded-xl" />
        <span className="text-xl font-bold text-white tracking-tight">Superclasse</span>
      </nav>

      {/* Floating circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="animate-float absolute -top-10 -left-10 h-72 w-72 rounded-full bg-white/5" />
        <div className="animate-float absolute top-1/3 right-10 h-48 w-48 rounded-full bg-white/5" style={{ animationDelay: '2s' }} />
        <div className="animate-float absolute bottom-20 left-1/4 h-56 w-56 rounded-full bg-white/5" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Cadastro de Professor</h1>
            <p className="mt-1 text-sm text-gray-500">Preencha seus dados para se cadastrar na plataforma</p>
          </div>

          {/* Steps indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { if (s < step) setStep(s as 1 | 2 | 3) }}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : step > s
                      ? 'bg-green-500 text-white cursor-pointer'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1 - Dados pessoais */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados Pessoais</h3>
                <div className="grid gap-3 sm:grid-cols-2">
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
                    label="Data de Nascimento"
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => onChange('data_nascimento', e.target.value)}
                  />
                  <Input
                    label="DDD"
                    value={form.ddd}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Senha *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => onChange('password', e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Input
                    label="Confirmar Senha *"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetir senha"
                  />
                </div>
              </div>
            )}

            {/* Step 2 - Endereço */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Endereço</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <p className="text-xs text-gray-400">Preencha o CEP para autocompletar</p>
                  </div>
                  <Input
                    label="Rua"
                    value={form.rua}
                    onChange={(e) => onChange('rua', e.target.value)}
                  />
                  <Input
                    label="Número"
                    value={form.numero_casa_ap}
                    onChange={(e) => onChange('numero_casa_ap', e.target.value)}
                  />
                  <Input
                    label="Bairro"
                    value={form.bairro}
                    onChange={(e) => onChange('bairro', e.target.value)}
                  />
                  <Input
                    label="Cidade"
                    value={form.cidade}
                    onChange={(e) => onChange('cidade', e.target.value)}
                  />
                  <Input
                    label="Estado"
                    value={form.estado}
                    onChange={(e) => onChange('estado', e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>
            )}

            {/* Step 3 - Dados bancários */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados Bancários</h3>
                <p className="text-xs text-gray-400">Necessário para receber pagamentos pela plataforma.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Banco (código)"
                    value={form.banco}
                    onChange={(e) => onChange('banco', e.target.value)}
                    placeholder="341"
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                    <select
                      value={form.account_type}
                      onChange={(e) => onChange('account_type', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="checking">Corrente</option>
                      <option value="savings">Poupança</option>
                    </select>
                  </div>
                  <Input
                    label="Agência"
                    value={form.agencia}
                    onChange={(e) => onChange('agencia', e.target.value)}
                    placeholder="0000"
                  />
                  <Input
                    label="Dígito Agência"
                    value={form.digito_agencia}
                    onChange={(e) => onChange('digito_agencia', e.target.value)}
                  />
                  <Input
                    label="Conta"
                    value={form.conta}
                    onChange={(e) => onChange('conta', e.target.value)}
                    placeholder="00000"
                  />
                  <Input
                    label="Dígito Conta"
                    value={form.digito_conta}
                    onChange={(e) => onChange('digito_conta', e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              {step > 1 ? (
                <Button type="button" variant="secondary" onClick={() => setStep((step - 1) as 1 | 2)}>
                  Voltar
                </Button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNextStep}>
                  Próximo
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      <footer className="relative z-10 pb-6 text-center text-sm text-white/50">
        &copy; {new Date().getFullYear()} Superclasse. Todos os direitos reservados.
      </footer>
    </div>
  )
}
