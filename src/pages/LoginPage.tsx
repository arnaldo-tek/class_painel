import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { signIn } from '@/lib/auth'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, isLoading } = useAuthContext()

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, isLoading, navigate])

  if (!isLoading && user) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'E-mail ou senha incorretos',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-gradient">
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
        <div className="animate-float absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-white/5" style={{ animationDelay: '1s' }} />
        <div className="animate-float absolute top-10 left-1/2 h-36 w-36 rounded-full bg-white/5" style={{ animationDelay: '3s' }} />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Mobile logo */}
          <div className="sm:hidden flex justify-center mb-6">
            <img src="/logo.png" alt="Superclasse" className="h-12" />
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
            <p className="mt-2 text-gray-500">Acesse sua conta para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl text-base font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar no Painel'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              É professor?{' '}
              <Link
                to="/cadastro-professor"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center text-sm text-white/50">
        &copy; {new Date().getFullYear()} Superclasse. Todos os direitos reservados.
      </footer>
    </div>
  )
}
