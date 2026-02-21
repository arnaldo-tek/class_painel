import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest } from '../_shared/supabase.ts'
import { pagarmeRequest, buildSplitRules } from '../_shared/pagarme.ts'

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

    // Resolve teacher receiver IDs for split
    const receiverIds = await resolveReceiverIds(supabase, body.curso_id, body.pacote_id)
    const splitRules = buildSplitRules(receiverIds)

    // Apply coupon discount if provided
    let finalAmount = body.amount
    if (body.cupom_codigo) {
      finalAmount = await applyCoupon(supabase, body.cupom_codigo, body.amount)
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
    const professorId = await resolveProfessorId(supabase, body.curso_id)
    await supabase.from('movimentacoes').insert({
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
      await createEnrollment(supabase, user.id, body.curso_id, body.pacote_id)
    }

    return jsonResponse({ order_id: order.id, status: order.status })
  } catch (err) {
    console.error('payment-checkout-card error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})

async function resolveReceiverIds(
  supabase: ReturnType<typeof createSupabaseFromRequest>,
  cursoId?: string,
  pacoteId?: string,
): Promise<string[]> {
  const ids: string[] = []

  if (cursoId) {
    const { data } = await supabase
      .from('cursos')
      .select('professor_id, professor:professor_profiles(pagarme_receiver_id)')
      .eq('id', cursoId)
      .single()
    if (data?.professor?.pagarme_receiver_id) {
      ids.push(data.professor.pagarme_receiver_id)
    }
  }

  if (pacoteId) {
    const { data } = await supabase
      .from('pacote_cursos')
      .select('curso:cursos(professor_id, professor:professor_profiles(pagarme_receiver_id))')
      .eq('pacote_id', pacoteId)
    if (data) {
      for (const row of data) {
        const rid = (row as any).curso?.professor?.pagarme_receiver_id
        if (rid) ids.push(rid)
      }
    }
  }

  return ids
}

async function resolveProfessorId(
  supabase: ReturnType<typeof createSupabaseFromRequest>,
  cursoId?: string,
): Promise<string | null> {
  if (!cursoId) return null
  const { data } = await supabase
    .from('cursos')
    .select('professor_id')
    .eq('id', cursoId)
    .single()
  return data?.professor_id ?? null
}

async function applyCoupon(
  supabase: ReturnType<typeof createSupabaseFromRequest>,
  codigo: string,
  amount: number,
): Promise<number> {
  const { data: cupom } = await supabase
    .from('cupons')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .eq('is_active', true)
    .single()

  if (!cupom) return amount

  // Check expiration
  if (cupom.valid_until && new Date(cupom.valid_until) < new Date()) return amount

  // Check max uses
  if (cupom.max_uses && cupom.uses_count >= cupom.max_uses) return amount

  // Apply discount (valor is in BRL, amount is in cents)
  const discountCents = Math.round(cupom.valor * 100)
  const final = Math.max(amount - discountCents, 0)

  // Increment uses
  await supabase
    .from('cupons')
    .update({ uses_count: (cupom.uses_count ?? 0) + 1 })
    .eq('id', cupom.id)

  return final
}

async function createEnrollment(
  supabase: ReturnType<typeof createSupabaseFromRequest>,
  userId: string,
  cursoId?: string,
  pacoteId?: string,
) {
  if (cursoId) {
    await supabase.from('enrollments').upsert(
      { user_id: userId, curso_id: cursoId },
      { onConflict: 'user_id,curso_id' },
    )
  }

  if (pacoteId) {
    // Enroll in all courses of the package
    const { data: cursos } = await supabase
      .from('pacote_cursos')
      .select('curso_id')
      .eq('pacote_id', pacoteId)

    if (cursos) {
      for (const c of cursos) {
        await supabase.from('enrollments').upsert(
          { user_id: userId, curso_id: c.curso_id },
          { onConflict: 'user_id,curso_id' },
        )
      }
    }

    // Create package access record
    await supabase.from('package_access').upsert(
      { user_id: userId, pacote_id: pacoteId },
      { onConflict: 'pacote_id,user_id' },
    )
  }
}
