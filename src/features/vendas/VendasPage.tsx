import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { useVendas, useResumoVendas } from './hooks'
import type { VendasFilters } from './api'
import type { OrderStatus } from '@/types/enums'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'failed', label: 'Falhou' },
  { value: 'refunded', label: 'Reembolsado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const statusBadge: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  failed: { label: 'Falhou', variant: 'danger' },
  refunded: { label: 'Reembolsado', variant: 'info' },
  cancelled: { label: 'Cancelado', variant: 'default' },
}

export function VendasPage() {
  const [filters, setFilters] = useState<VendasFilters>({ page: 1 })
  const { data, isLoading } = useVendas(filters)
  const { data: resumo } = useResumoVendas()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>

      {/* Summary cards */}
      {resumo && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Receita Total" value={`R$ ${resumo.totalReceita.toFixed(2)}`} />
          <SummaryCard label="Taxa Plataforma" value={`R$ ${resumo.totalPlataforma.toFixed(2)}`} />
          <SummaryCard label="Repasse Professores" value={`R$ ${resumo.totalProfessores.toFixed(2)}`} />
          <SummaryCard label="Total de Vendas" value={String(resumo.totalVendas)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          placeholder="Todos os status"
          options={STATUS_OPTIONS}
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as OrderStatus) || undefined, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined, page: 1 }))}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !data?.vendas.length ? (
        <EmptyState icon={<DollarSign className="h-12 w-12" />} title="Nenhuma venda encontrada" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Curso/Pacote</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vendas.map((v) => {
                const badge = statusBadge[v.status ?? 'pending']
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="font-medium">{v.nome_cliente ?? '—'}</p>
                      <p className="text-xs text-gray-500">{v.email_cliente}</p>
                    </TableCell>
                    <TableCell>{v.nome_curso ?? '—'}</TableCell>
                    <TableCell className="font-medium">R$ {Number(v.valor).toFixed(2)}</TableCell>
                    <TableCell className="text-gray-500">R$ {Number(v.taxa_plataforma ?? 0).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                    <TableCell className="text-gray-500">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <Pagination page={filters.page ?? 1} totalPages={data.totalPages} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
