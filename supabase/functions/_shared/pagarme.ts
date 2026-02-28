const PAGARME_BASE_URL = Deno.env.get('PAGARME_BASE_URL') ??
  'https://api.pagar.me/core/v5'

const TRANSFER_PROXY_URL = Deno.env.get('TRANSFER_PROXY_URL') ?? ''

const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY') ?? ''

const PLATFORM_RECEIVER_ID = 're_cm7m9wnhe0jnv0l9tbhvr7rky'

export interface SplitRule {
  amount: number
  recipient_id: string
  type: 'percentage'
  options: {
    charge_processing_fee: boolean
    charge_remainder_fee: boolean
    liable: boolean
  }
}

/**
 * Build Pagar.me split rules.
 * Platform always gets 25% (bears fees). Remaining 75% split equally among unique teachers.
 */
export function buildSplitRules(receiverIds: string[]): SplitRule[] {
  const unique = [...new Set(receiverIds)]
  const teacherShare = unique.length > 0 ? Math.floor(75 / unique.length) : 0
  const platformShare = 100 - teacherShare * unique.length

  const rules: SplitRule[] = [
    {
      amount: platformShare,
      recipient_id: PLATFORM_RECEIVER_ID,
      type: 'percentage',
      options: { charge_processing_fee: true, charge_remainder_fee: true, liable: true },
    },
  ]

  for (const rid of unique) {
    rules.push({
      amount: teacherShare,
      recipient_id: rid,
      type: 'percentage',
      options: { charge_processing_fee: false, charge_remainder_fee: false, liable: false },
    })
  }

  return rules
}

export interface PagarmeRequestOptions {
  useTransferProxy?: boolean
}

/** Generic Pagar.me API call */
export async function pagarmeRequest<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
  options?: PagarmeRequestOptions,
): Promise<T> {
  const baseUrl = options?.useTransferProxy && TRANSFER_PROXY_URL
    ? TRANSFER_PROXY_URL
    : PAGARME_BASE_URL

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (PAGARME_API_KEY) {
    headers['Authorization'] = `Basic ${btoa(PAGARME_API_KEY + ':')}`
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new PagarmeError(res.status, data)
  }

  return data as T
}

export class PagarmeError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`Pagar.me API error: ${status}`)
    this.name = 'PagarmeError'
    this.status = status
    this.data = data
  }
}
