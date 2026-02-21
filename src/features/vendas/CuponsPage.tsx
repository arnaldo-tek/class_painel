import { useState, type FormEvent } from 'react'
import { Ticket, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useCupons, useCreateCupom, useUpdateCupom, useDeleteCupom } from './hooks'
import type { Cupom } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

export function CuponsPage() {
  const { data: cupons, isLoading } = useCupons()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteMutation = useDeleteCupom()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null) }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      {showForm && (
        <CupomForm
          editingId={editingId}
          cupons={cupons ?? []}
          onClose={() => { setShowForm(false); setEditingId(null) }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !cupons?.length ? (
        <EmptyState icon={<Ticket className="h-12 w-12" />} title="Nenhum cupom encontrado" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cupons.map((c) => {
              const expired = c.valid_until && new Date(c.valid_until) < new Date()
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.codigo}</TableCell>
                  <TableCell>R$ {Number(c.valor).toFixed(2)}</TableCell>
                  <TableCell>{c.uses_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</TableCell>
                  <TableCell>
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString('pt-BR') : 'Sem limite'}
                  </TableCell>
                  <TableCell>
                    {!c.is_active ? (
                      <Badge variant="default">Inativo</Badge>
                    ) : expired ? (
                      <Badge variant="danger">Expirado</Badge>
                    ) : (
                      <Badge variant="success">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingId(c.id); setShowForm(true) }}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
                      ><Pencil className="h-4 w-4" /></button>
                      <button
                        onClick={() => { if (confirm(`Excluir cupom "${c.codigo}"?`)) deleteMutation.mutate(c.id) }}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      ><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function CupomForm({ editingId, cupons, onClose }: { editingId: string | null; cupons: Cupom[]; onClose: () => void }) {
  const existing = cupons.find((c) => c.id === editingId)
  const [codigo, setCodigo] = useState(existing?.codigo ?? '')
  const [valor, setValor] = useState(existing?.valor ? String(existing.valor) : '')
  const [maxUses, setMaxUses] = useState(existing?.max_uses ? String(existing.max_uses) : '')
  const [validUntil, setValidUntil] = useState(existing?.valid_until ? existing.valid_until.slice(0, 10) : '')
  const [isActive, setIsActive] = useState(existing?.is_active ?? true)
  const [error, setError] = useState('')

  const createMutation = useCreateCupom()
  const updateMutation = useUpdateCupom()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim() || !valor) { setError('Código e valor são obrigatórios'); return }
    try {
      const payload = {
        codigo: codigo.trim().toUpperCase(),
        valor: parseFloat(valor),
        max_uses: maxUses ? parseInt(maxUses) : null,
        valid_until: validUntil || null,
        is_active: isActive,
      }
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{editingId ? 'Editar Cupom' : 'Novo Cupom'}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Código (ex: DESCONTO10)" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          <Input placeholder="Valor (R$)" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} required />
          <Input placeholder="Máximo de usos" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <span className="text-sm text-gray-700">Cupom ativo</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isSaving}>{isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}</Button>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}
