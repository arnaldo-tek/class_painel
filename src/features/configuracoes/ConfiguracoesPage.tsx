import { useState, useEffect, type FormEvent } from 'react'
import { useSetting, useUpdateSetting } from './hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      <MarkupSection />
    </div>
  )
}

function MarkupSection() {
  const { data: currentValue, isLoading } = useSetting('markup_percentage')
  const updateMutation = useUpdateSetting()
  const [value, setValue] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (currentValue !== undefined && currentValue !== null) {
      setValue(currentValue)
    }
  }, [currentValue])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num) || num < 0 || num > 100) return
    await updateMutation.mutateAsync({ key: 'markup_percentage', value: String(num) })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
      </div>
    )
  }

  const precoExemplo = 100
  const markup = parseFloat(value) || 0
  const precoFinal = precoExemplo * (1 + markup / 100)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Markup da Plataforma</h2>
        <p className="text-sm text-gray-500 mt-1">
          Percentual adicionado ao preço do professor para definir o preço final do aluno.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Markup (%)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={value}
          onChange={(e) => { setValue(e.target.value); setSuccess(false) }}
          required
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Exemplo</label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Professor cobra R$ {precoExemplo.toFixed(2)} → Aluno paga{' '}
            <strong className="text-gray-900">R$ {precoFinal.toFixed(2)}</strong>
          </div>
        </div>
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
