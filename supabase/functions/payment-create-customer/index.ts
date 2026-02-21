import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest } from '../_shared/supabase.ts'
import { pagarmeRequest } from '../_shared/pagarme.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const { name, email } = await req.json()
    if (!name || !email) return errorResponse('name and email are required')

    // Create customer in Pagar.me
    const customer = await pagarmeRequest<{ id: string }>('/customers', 'POST', {
      name,
      email,
      code: user.id,
    })

    // Save customer ID on profile
    await supabase
      .from('profiles')
      .update({ pagarme_customer_id: customer.id })
      .eq('id', user.id)

    return jsonResponse({ customer_id: customer.id })
  } catch (err) {
    console.error('payment-create-customer error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
