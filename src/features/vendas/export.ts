import * as XLSX from 'xlsx'

interface MovimentacaoExport {
  pagarme_order_id: string | null
  valor: number
  nome_curso: string | null
  valor_curso: number | null
  nome_cliente: string | null
  email_cliente: string | null
  contato_cliente: string | null
  created_at: string | null
  taxa_plataforma: number | null
  status: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
}

export function exportVendasToExcel(vendas: MovimentacaoExport[], filename = 'vendas') {
  const rows = vendas.map((v) => ({
    'ID Pedido': v.pagarme_order_id ?? '',
    'Valor': Number(v.valor ?? 0),
    'Produto': v.nome_curso ?? '',
    'Valor Produto': Number(v.valor_curso ?? 0),
    'Nome Cliente': v.nome_cliente ?? '',
    'Email': v.email_cliente ?? '',
    'Contato': v.contato_cliente ?? '',
    'Data': v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : '',
    'Status': STATUS_LABELS[v.status ?? ''] ?? v.status ?? '',
    'Taxa Plataforma': Number(v.taxa_plataforma ?? 0),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Vendas')

  // Auto-size columns
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r]).length)),
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `${filename}.xlsx`)
}
