import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const payload = await req.json()
    const event = payload.type as string | undefined
    const data = payload.data as Record<string, any> | undefined

    if (!event || !data) {
      return errorResponse('Invalid webhook payload')
    }

    console.log(`professor-transfer-webhook received: ${event}`, data.id)

    const supabase = createSupabaseAdmin()

    if (event === 'recipient.transfer.paid' || event === 'transfer.paid') {
      await updateTransferStatus(supabase, data.id, 'transferred')
    } else if (event === 'recipient.transfer.failed' || event === 'transfer.failed') {
      await updateTransferStatus(supabase, data.id, 'failed')
    } else if (event === 'recipient.transfer.created' || event === 'transfer.created') {
      await updateTransferStatus(supabase, data.id, data.status ?? 'pending_transfer')
    }

    return jsonResponse({ received: true })
  } catch (err) {
    console.error('professor-transfer-webhook error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})

async function updateTransferStatus(supabase: any, transferId: string, status: string) {
  const { error } = await supabase
    .from('transferencias')
    .update({ status })
    .eq('pagarme_transfer_id', transferId)

  if (error) {
    console.error(`Failed to update transfer ${transferId} to ${status}:`, error)
    throw error
  }

  console.log(`Transfer ${transferId} updated to ${status}`)
}
