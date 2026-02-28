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

    const { name, email, document, document_type, phones, customer_id_update } = await req.json()
    const existingId = customer_id_update ?? req.headers.get('x-customer-update')

    let customer: { id: string }

    if (existingId) {
      // Update existing customer (only send fields that need updating)
      const updatePayload: Record<string, unknown> = {}
      if (document) {
        updatePayload.document = document
        updatePayload.document_type = document_type ?? 'CPF'
        updatePayload.type = 'individual'
      }
      if (phones) updatePayload.phones = phones
      customer = await pagarmeRequest<{ id: string }>(`/customers/${existingId}`, 'PUT', updatePayload)
    } else {
      // Create new customer
      if (!name || !email) return errorResponse('name and email are required')
      const createPayload: Record<string, unknown> = {
        name,
        email,
        code: user.id,
      }
      if (document) {
        createPayload.document = document
        createPayload.document_type = document_type ?? 'CPF'
        createPayload.type = 'individual'
      }
      if (phones) createPayload.phones = phones
      customer = await pagarmeRequest<{ id: string }>('/customers', 'POST', createPayload)
    }

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
