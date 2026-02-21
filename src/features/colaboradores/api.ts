import { supabase } from '@/lib/supabase'
import type { AdminPermission } from '@/types/enums'

export interface Colaborador {
  user_id: string
  email: string
  display_name: string | null
  phone_number: string | null
  cpf: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  cep: string | null
  cidade: string | null
  estado: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  digito_opcional: string | null
  chave_pix: string | null
  permissions: string[]
}

export interface ColaboradorFormData {
  email: string
  password?: string
  display_name: string
  phone_number: string
  cpf: string
  endereco: string
  numero: string
  complemento: string
  cep: string
  cidade: string
  estado: string
  banco: string
  agencia: string
  conta: string
  digito_opcional: string
  chave_pix: string
  permissions: AdminPermission[]
}

export async function fetchColaboradores(): Promise<Colaborador[]> {
  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'colaborador')

  if (rolesErr) throw rolesErr
  if (!roles?.length) return []

  const userIds = roles.map((r) => r.user_id)

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, display_name, phone_number, cpf, endereco, numero, complemento, cep, cidade, estado, banco, agencia, conta, digito_opcional, chave_pix')
    .in('id', userIds)

  if (profErr) throw profErr

  const { data: perms, error: permErr } = await supabase
    .from('admin_permissions')
    .select('user_id, permission')
    .in('user_id', userIds)

  if (permErr) throw permErr

  const permMap = new Map<string, string[]>()
  for (const p of perms ?? []) {
    const list = permMap.get(p.user_id) ?? []
    list.push(p.permission)
    permMap.set(p.user_id, list)
  }

  return (profiles ?? []).map((p) => ({
    user_id: p.id,
    email: p.email,
    display_name: p.display_name,
    phone_number: p.phone_number,
    cpf: p.cpf,
    endereco: p.endereco,
    numero: p.numero,
    complemento: p.complemento,
    cep: p.cep,
    cidade: p.cidade,
    estado: p.estado,
    banco: p.banco,
    agencia: p.agencia,
    conta: p.conta,
    digito_opcional: p.digito_opcional,
    chave_pix: p.chave_pix,
    permissions: permMap.get(p.id) ?? [],
  }))
}

export async function createColaborador(data: ColaboradorFormData) {
  const { data: result, error } = await supabase.functions.invoke('manage-colaborador', {
    body: { action: 'create', ...data },
  })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)
  return result
}

export async function updateColaborador(userId: string, data: Omit<ColaboradorFormData, 'email' | 'password'>) {
  const { data: result, error } = await supabase.functions.invoke('manage-colaborador', {
    body: { action: 'update', user_id: userId, ...data },
  })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)
  return result
}

export async function deleteColaborador(userId: string) {
  const { data: result, error } = await supabase.functions.invoke('manage-colaborador', {
    body: { action: 'delete', user_id: userId },
  })
  if (error) throw new Error(error.message)
  if (result?.error) throw new Error(result.error)
  return result
}
