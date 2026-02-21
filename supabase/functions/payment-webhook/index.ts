import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const payload = await req.json()
    const event = payload.type as string | undefined
    const data = payload.data as Record<string, any> | undefined

    if (!event || !data) {
      return errorResponse('Invalid webhook payload')
    }

    console.log(`Webhook received: ${event}`, data.id)

    const supabase = createSupabaseAdmin()

    if (event === 'order.paid' || event === 'order.payment_confirmed') {
      await handleOrderPaid(supabase, data)
    } else if (event === 'order.payment_failed') {
      await handleOrderFailed(supabase, data)
    } else if (event === 'order.canceled') {
      await handleOrderCanceled(supabase, data)
    }

    return jsonResponse({ received: true })
  } catch (err) {
    console.error('payment-webhook error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})

async function handleOrderPaid(supabase: any, data: Record<string, any>) {
  const orderId = data.id as string

  // Update movimentacao status
  const { data: mov } = await supabase
    .from('movimentacoes')
    .update({ status: 'paid' })
    .eq('pagarme_order_id', orderId)
    .select('user_id, curso_id, pacote_id')
    .single()

  if (!mov) {
    console.warn(`No movimentacao found for order ${orderId}`)
    return
  }

  // Create enrollment
  if (mov.curso_id) {
    await supabase.from('enrollments').upsert(
      { user_id: mov.user_id, curso_id: mov.curso_id },
      { onConflict: 'user_id,curso_id' },
    )
  }

  if (mov.pacote_id) {
    // Enroll in all package courses
    const { data: cursos } = await supabase
      .from('pacote_cursos')
      .select('curso_id')
      .eq('pacote_id', mov.pacote_id)

    if (cursos) {
      for (const c of cursos) {
        await supabase.from('enrollments').upsert(
          { user_id: mov.user_id, curso_id: c.curso_id },
          { onConflict: 'user_id,curso_id' },
        )
      }
    }

    await supabase.from('package_access').upsert(
      { user_id: mov.user_id, pacote_id: mov.pacote_id },
      { onConflict: 'pacote_id,user_id' },
    )
  }

  // Send notification
  await supabase.from('notificacoes').insert({
    user_id: mov.user_id,
    titulo: 'Pagamento confirmado',
    descricao: 'Seu pagamento foi confirmado! Acesse seus cursos.',
  })
}

async function handleOrderFailed(supabase: any, data: Record<string, any>) {
  const orderId = data.id as string

  const { data: mov } = await supabase
    .from('movimentacoes')
    .update({ status: 'failed' })
    .eq('pagarme_order_id', orderId)
    .select('user_id')
    .single()

  if (mov) {
    await supabase.from('notificacoes').insert({
      user_id: mov.user_id,
      titulo: 'Pagamento recusado',
      descricao: 'Seu pagamento foi recusado. Tente novamente.',
    })
  }
}

async function handleOrderCanceled(supabase: any, data: Record<string, any>) {
  const orderId = data.id as string

  await supabase
    .from('movimentacoes')
    .update({ status: 'cancelled' })
    .eq('pagarme_order_id', orderId)
}
