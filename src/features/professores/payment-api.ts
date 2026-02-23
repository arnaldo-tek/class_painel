import { supabase } from '@/lib/supabase'

export interface RegisterRecipientData {
  professor_id: string
  type: 'individual' | 'company'
  name: string
  email: string
  document: string
  phone: { country_code: string; area_code: string; number: string }
  birthdate?: string
  monthly_income?: number
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  bank_account: {
    bank: string
    branch_number: string
    branch_check_digit?: string
    account_number: string
    account_check_digit: string
    type: 'checking' | 'savings'
    holder_name: string
    holder_document: string
    holder_type: 'individual' | 'company'
  }
}

export interface RecipientBalance {
  available_amount: number
  waiting_funds_amount: number
  transferred_amount: number
}

export interface Transferencia {
  id: string
  pagarme_transfer_id: string
  recipient_id: string
  amount: number
  status: string
  requested_by: string
  created_at: string
}

export async function registerRecipient(data: RegisterRecipientData) {
  const { data: result, error } = await supabase.functions.invoke('payment-register-recipient', {
    body: data,
  })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)
  return result as { recipient_id: string; status: string }
}

export async function fetchRecipientBalance(recipientId: string): Promise<RecipientBalance> {
  const { data: result, error } = await supabase.functions.invoke('payment-recipient-balance', {
    body: { recipient_id: recipientId },
  })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)
  return result as RecipientBalance
}

export async function fetchRecipientDetails(recipientId: string) {
  const { data: result, error } = await supabase.functions.invoke('payment-recipient-details', {
    body: { recipient_id: recipientId },
  })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)
  return result
}

export async function requestTransfer(recipientId: string, amount: number) {
  const { data: result, error } = await supabase.functions.invoke('payment-transfer', {
    body: { recipient_id: recipientId, amount },
  })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)
  return result as { transfer_id: string; status: string; amount: number }
}

export async function fetchTransferHistory(recipientId: string): Promise<Transferencia[]> {
  const { data, error } = await supabase
    .from('transferencias')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Transferencia[]
}
