import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest, createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest, buildSplitRules } from '../_shared/pagarme.ts'
import { resolveReceiverIds, resolveProfessorId, applyCoupon, createEnrollment } from '../_shared/checkout.ts'

interface CardCheckoutBody {
  customer_id: string
  amount: number // in cents
  card: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
  }
  installments: number
  curso_id?: string
  pacote_id?: string
  cupom_codigo?: string
}

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const body: CardCheckoutBody = await req.json()
    if (!body.customer_id || !body.amount || !body.card) {
      return errorResponse('customer_id, amount, and card are required')
    }

    // Admin client for DB writes (user JWT is blocked by RLS)
    const admin = createSupabaseAdmin()

    // Resolve teacher receiver IDs for split
    const receiverIds = await resolveReceiverIds(admin, body.curso_id, body.pacote_id)
    const splitRules = buildSplitRules(receiverIds)

    // Apply coupon discount if provided
    let finalAmount = body.amount
    if (body.cupom_codigo) {
      finalAmount = await applyCoupon(admin, body.cupom_codigo, body.amount)
    }

    // Create order in Pagar.me
    const order = await pagarmeRequest<{ id: string; status: string }>('/orders', 'POST', {
      customer_id: body.customer_id,
      items: [
        {
          amount: finalAmount,
          description: 'SuperClasse',
          quantity: 1,
          code: body.curso_id ?? body.pacote_id ?? 'order',
        },
      ],
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            card: {
              number: body.card.number,
              holder_name: body.card.holder_name,
              exp_month: body.card.exp_month,
              exp_year: body.card.exp_year,
              cvv: body.card.cvv,
            },
            installments: body.installments || 1,
            statement_descriptor: 'SuperClasse',
          },
          split: splitRules,
        },
      ],
    })

    // Create movimentacao record
    const professorId = await resolveProfessorId(admin, body.curso_id)
    await admin.from('movimentacoes').insert({
      pagarme_order_id: order.id,
      valor: finalAmount / 100,
      valor_curso: body.amount / 100,
      taxa_plataforma: (finalAmount / 100) * 0.25,
      user_id: user.id,
      curso_id: body.curso_id ?? null,
      pacote_id: body.pacote_id ?? null,
      professor_id: professorId,
      status: order.status === 'paid' ? 'paid' : 'pending',
    })

    // If paid immediately, create enrollment
    if (order.status === 'paid') {
      await createEnrollment(admin, user.id, body.curso_id, body.pacote_id)
    }

    return jsonResponse({ order_id: order.id, status: order.status })
  } catch (err) {
    console.error('payment-checkout-card error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
