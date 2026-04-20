import { jsonResponse, errorResponse, handleCors } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest } from '../_shared/pagarme.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseAdmin()

    // Fetch all pending transfers
    const { data: pendentes, error } = await supabase
      .from('transferencias')
      .select('id, pagarme_transfer_id, status')
      .eq('status', 'pending_transfer')

    if (error) throw error

    if (!pendentes?.length) {
      return jsonResponse({ message: 'Nenhuma transferência pendente', updated: 0 })
    }

    console.log(`Syncing ${pendentes.length} pending transfers...`)

    let updated = 0
    const results: { id: string; old: string; new: string }[] = []

    for (const t of pendentes) {
      try {
        const transfer = await pagarmeRequest<{ id: string; status: string }>(
          `/transfers/${t.pagarme_transfer_id}`,
          'GET',
          undefined,
          { useTransferProxy: true },
        )

        if (transfer.status !== t.status) {
          await supabase
            .from('transferencias')
            .update({ status: transfer.status })
            .eq('id', t.id)

          results.push({ id: t.pagarme_transfer_id, old: t.status, new: transfer.status })
          updated++
        }
      } catch (err) {
        console.error(`Failed to sync transfer ${t.pagarme_transfer_id}:`, err)
      }
    }

    console.log(`Updated ${updated} transfers`)
    return jsonResponse({ updated, total: pendentes.length, results })
  } catch (err) {
    console.error('sync-transfer-status error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
