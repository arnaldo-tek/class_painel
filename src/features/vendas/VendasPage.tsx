import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import {
  DollarSign, Search, Download, ChevronDown, ChevronRight,
  Users, Tag, TrendingUp, Percent, Wallet,
} from 'lucide-react'
import {
  useVendas, useResumoVendas, useVendasPorProfessor, useVendasPorCategoria,
  useVendasDetalheProfessor, useVendasDetalheCategoria,
} from './hooks'
import { fetchVendasParaExportar } from './api'
import { exportVendasToExcel } from './export'
import type { VendasFilters } from './api'
import type { OrderStatus } from '@/types/enums'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/cn'

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

type TabKey = 'geral' | 'professor' | 'categoria'

const TABS: { key: TabKey; label: string; icon: typeof DollarSign }[] = [
  { key: 'geral', label: 'Geral', icon: DollarSign },
  { key: 'professor', label: 'Por Professor', icon: Users },
  { key: 'categoria', label: 'Por Categoria', icon: Tag },
]

function defaultDateFrom() {
  return format(subDays(new Date(), 30), 'yyyy-MM-dd')
}

function defaultDateTo() {
  return format(new Date(), 'yyyy-MM-dd')
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function VendasPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('geral')
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'geral' && (
        <TabGeral dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
      )}
      {activeTab === 'professor' && (
        <TabPorProfessor dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
      )}
      {activeTab === 'categoria' && (
        <TabPorCategoria dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
      )}
    </div>
  )
}

// ─── Summary Cards ──────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string
  icon: typeof DollarSign
  color: 'green' | 'blue' | 'purple' | 'orange'
}

const cardColors = {
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
}

const iconColors = {
  green: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
}

function SummaryCard({ label, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', cardColors[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
        <div className={cn('rounded-lg p-2.5', iconColors[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ─── Date Filter Row ────────────────────────────────────────────────────────

interface DateFilterProps {
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  children?: React.ReactNode
}

function DateFilterRow({ dateFrom, dateTo, onDateFromChange, onDateToChange, children }: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {children}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-500">De</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-auto"
        />
        <span className="text-sm text-gray-500">até</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-auto"
        />
      </div>
    </div>
  )
}

// ─── Spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

// ─── Tab Geral ──────────────────────────────────────────────────────────────

interface TabProps {
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
}

function TabGeral({ dateFrom, dateTo, onDateFromChange, onDateToChange }: TabProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<VendasFilters>({ page: 1, dateFrom: defaultDateFrom(), dateTo: defaultDateTo() })
  const [exporting, setExporting] = useState(false)

  const currentFilters = useMemo<VendasFilters>(() => ({
    ...filters,
    search: search || undefined,
    dateFrom,
    dateTo,
  }), [filters, search, dateFrom, dateTo])

  const { data, isLoading } = useVendas(currentFilters)
  const { data: resumo } = useResumoVendas(dateFrom, dateTo)

  function handleSearch() {
    setSearch(searchInput)
    setFilters((f) => ({ ...f, page: 1 }))
  }

  async function handleExport() {
    setExporting(true)
    try {
      const vendas = await fetchVendasParaExportar(dateFrom, dateTo)
      exportVendasToExcel(vendas, `vendas_${dateFrom}_${dateTo}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {resumo && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Receita Total" value={formatCurrency(resumo.totalReceita)} icon={TrendingUp} color="green" />
          <SummaryCard label="Taxa Plataforma" value={formatCurrency(resumo.totalPlataforma)} icon={Percent} color="blue" />
          <SummaryCard label="Repasse Professores" value={formatCurrency(resumo.totalProfessores)} icon={Wallet} color="purple" />
          <SummaryCard label="Total de Vendas" value={String(resumo.totalVendas)} icon={DollarSign} color="orange" />
        </div>
      )}

      {/* Filters */}
      <DateFilterRow dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={onDateFromChange} onDateToChange={onDateToChange}>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar cliente..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-60"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select
          placeholder="Todos os status"
          options={STATUS_OPTIONS}
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as OrderStatus) || undefined, page: 1 }))}
        />
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-1.5" />
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </DateFilterRow>

      {/* Table */}
      {isLoading ? <Spinner /> : !data?.vendas.length ? (
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
                    <TableCell className="font-medium">{formatCurrency(Number(v.valor))}</TableCell>
                    <TableCell className="text-gray-500">{formatCurrency(Number(v.taxa_plataforma ?? 0))}</TableCell>
                    <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                    <TableCell className="text-gray-500">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <Pagination
            page={currentFilters.page ?? 1}
            totalPages={data.totalPages}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </>
      )}
    </div>
  )
}

// ─── Tab Por Professor ──────────────────────────────────────────────────────

function TabPorProfessor({ dateFrom, dateTo, onDateFromChange, onDateToChange }: TabProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: professores, isLoading } = useVendasPorProfessor(dateFrom, dateTo)

  const filtered = useMemo(() => {
    if (!professores) return []
    if (!search) return professores
    const q = search.toLowerCase()
    return professores.filter((p) => p.nome_professor.toLowerCase().includes(q))
  }, [professores, search])

  function handleSearch() {
    setSearch(searchInput)
  }

  return (
    <div className="space-y-6">
      <DateFilterRow dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={onDateFromChange} onDateToChange={onDateToChange}>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar professor..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-60"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </DateFilterRow>

      {isLoading ? <Spinner /> : !filtered.length ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Nenhuma venda por professor encontrada" />
      ) : (
        <div className="space-y-3">
          {filtered.map((prof) => (
            <div key={prof.professor_id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === prof.professor_id ? null : prof.professor_id)}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                {prof.foto_url ? (
                  <img src={prof.foto_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {prof.nome_professor.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{prof.nome_professor}</p>
                  <p className="text-sm text-gray-500">{prof.total_vendas} venda{prof.total_vendas !== 1 ? 's' : ''}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-gray-500">Fat. Total</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(prof.fat_total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Professor</p>
                    <p className="font-semibold text-purple-600">{formatCurrency(prof.fat_professor)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Plataforma</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(prof.fat_plataforma)}</p>
                  </div>
                </div>
                {expandedId === prof.professor_id
                  ? <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  : <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                }
              </button>

              {expandedId === prof.professor_id && (
                <ProfessorDetalhe professorId={prof.professor_id} dateFrom={dateFrom} dateTo={dateTo} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfessorDetalhe({ professorId, dateFrom, dateTo }: { professorId: string; dateFrom: string; dateTo: string }) {
  const { data: cursos, isLoading } = useVendasDetalheProfessor(professorId, dateFrom, dateTo)

  if (isLoading) return <div className="px-4 pb-4"><Spinner /></div>
  if (!cursos?.length) return <p className="px-4 pb-4 text-sm text-gray-400">Nenhum curso encontrado.</p>

  const totals = cursos.reduce(
    (acc, c) => ({
      vendas: acc.vendas + c.total_vendas,
      total: acc.total + c.fat_total,
      professor: acc.professor + c.fat_professor,
      plataforma: acc.plataforma + c.fat_plataforma,
    }),
    { vendas: 0, total: 0, professor: 0, plataforma: 0 },
  )

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
      {/* Mini-cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniCard label="Vendas" value={String(totals.vendas)} />
        <MiniCard label="Fat. Total" value={formatCurrency(totals.total)} />
        <MiniCard label="Professor (75%)" value={formatCurrency(totals.professor)} />
        <MiniCard label="Plataforma (25%)" value={formatCurrency(totals.plataforma)} />
      </div>

      {/* Course list */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Curso</TableHead>
            <TableHead className="text-right">Vendas</TableHead>
            <TableHead className="text-right">Fat. Total</TableHead>
            <TableHead className="text-right">Professor</TableHead>
            <TableHead className="text-right">Plataforma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cursos.map((c) => (
            <TableRow key={c.curso_id ?? 'sem'}>
              <TableCell className="font-medium">{c.nome_curso}</TableCell>
              <TableCell className="text-right">{c.total_vendas}</TableCell>
              <TableCell className="text-right">{formatCurrency(c.fat_total)}</TableCell>
              <TableCell className="text-right text-purple-600">{formatCurrency(c.fat_professor)}</TableCell>
              <TableCell className="text-right text-blue-600">{formatCurrency(c.fat_plataforma)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Tab Por Categoria ──────────────────────────────────────────────────────

function TabPorCategoria({ dateFrom, dateTo, onDateFromChange, onDateToChange }: TabProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: categorias, isLoading } = useVendasPorCategoria(dateFrom, dateTo)

  const filtered = useMemo(() => {
    if (!categorias) return []
    if (!search) return categorias
    const q = search.toLowerCase()
    return categorias.filter((c) => c.nome_categoria.toLowerCase().includes(q))
  }, [categorias, search])

  function handleSearch() {
    setSearch(searchInput)
  }

  return (
    <div className="space-y-6">
      <DateFilterRow dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={onDateFromChange} onDateToChange={onDateToChange}>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar categoria..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-60"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </DateFilterRow>

      {isLoading ? <Spinner /> : !filtered.length ? (
        <EmptyState icon={<Tag className="h-12 w-12" />} title="Nenhuma venda por categoria encontrada" />
      ) : (
        <div className="space-y-3">
          {filtered.map((cat) => (
            <div key={cat.categoria_id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === cat.categoria_id ? null : cat.categoria_id)}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{cat.nome_categoria}</p>
                  <p className="text-sm text-gray-500">{cat.total_vendas} venda{cat.total_vendas !== 1 ? 's' : ''}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-gray-500">Fat. Total</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(cat.fat_total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Professor</p>
                    <p className="font-semibold text-purple-600">{formatCurrency(cat.fat_professor)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Plataforma</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(cat.fat_plataforma)}</p>
                  </div>
                </div>
                {expandedId === cat.categoria_id
                  ? <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  : <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                }
              </button>

              {expandedId === cat.categoria_id && (
                <CategoriaDetalhe categoriaId={cat.categoria_id} dateFrom={dateFrom} dateTo={dateTo} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoriaDetalhe({ categoriaId, dateFrom, dateTo }: { categoriaId: string; dateFrom: string; dateTo: string }) {
  const { data: cursos, isLoading } = useVendasDetalheCategoria(categoriaId, dateFrom, dateTo)

  if (isLoading) return <div className="px-4 pb-4"><Spinner /></div>
  if (!cursos?.length) return <p className="px-4 pb-4 text-sm text-gray-400">Nenhum curso encontrado.</p>

  const totals = cursos.reduce(
    (acc, c) => ({
      vendas: acc.vendas + c.total_vendas,
      total: acc.total + c.fat_total,
      professor: acc.professor + c.fat_professor,
      plataforma: acc.plataforma + c.fat_plataforma,
    }),
    { vendas: 0, total: 0, professor: 0, plataforma: 0 },
  )

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniCard label="Vendas" value={String(totals.vendas)} />
        <MiniCard label="Fat. Total" value={formatCurrency(totals.total)} />
        <MiniCard label="Professor (75%)" value={formatCurrency(totals.professor)} />
        <MiniCard label="Plataforma (25%)" value={formatCurrency(totals.plataforma)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Curso</TableHead>
            <TableHead className="text-right">Vendas</TableHead>
            <TableHead className="text-right">Fat. Total</TableHead>
            <TableHead className="text-right">Professor</TableHead>
            <TableHead className="text-right">Plataforma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cursos.map((c) => (
            <TableRow key={c.curso_id ?? 'sem'}>
              <TableCell className="font-medium">{c.nome_curso}</TableCell>
              <TableCell className="text-right">{c.total_vendas}</TableCell>
              <TableCell className="text-right">{formatCurrency(c.fat_total)}</TableCell>
              <TableCell className="text-right text-purple-600">{formatCurrency(c.fat_professor)}</TableCell>
              <TableCell className="text-right text-blue-600">{formatCurrency(c.fat_plataforma)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Mini Card ──────────────────────────────────────────────────────────────

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  )
}
