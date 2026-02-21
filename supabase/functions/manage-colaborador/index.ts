import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin, createSupabaseFromRequest } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // Verify caller is admin
    const supabaseUser = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const { data: callerRole } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!callerRole) return errorResponse('Apenas admins podem gerenciar colaboradores', 403)

    const body = await req.json()
    const { action } = body

    const admin = createSupabaseAdmin()

    if (action === 'create') {
      const { email, password, display_name, phone_number, cpf, endereco, numero, complemento, cep, cidade, estado, banco, agencia, conta, digito_opcional, chave_pix, permissions } = body

      if (!email || !password) return errorResponse('Email e senha são obrigatórios')

      // Create auth user
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createErr) {
        if (createErr.message?.includes('already been registered')) {
          return errorResponse('Já existe um usuário com este e-mail')
        }
        throw createErr
      }

      const userId = newUser.user.id

      // Update profile with all fields
      const { error: profErr } = await admin
        .from('profiles')
        .update({
          display_name, phone_number, cpf, endereco, numero, complemento, cep, cidade, estado,
          banco, agencia, conta, digito_opcional, chave_pix,
        })
        .eq('id', userId)

      if (profErr) throw profErr

      // Add colaborador role
      const { error: roleErr } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role: 'colaborador' })

      if (roleErr) throw roleErr

      // Add permissions
      if (permissions?.length) {
        const rows = permissions.map((p: string) => ({ user_id: userId, permission: p }))
        const { error: permErr } = await admin.from('admin_permissions').insert(rows)
        if (permErr) throw permErr
      }

      return jsonResponse({ user_id: userId })
    }

    if (action === 'update') {
      const { user_id, display_name, phone_number, cpf, endereco, numero, complemento, cep, cidade, estado, banco, agencia, conta, digito_opcional, chave_pix, permissions } = body

      if (!user_id) return errorResponse('user_id é obrigatório')

      // Update profile
      const { error: profErr } = await admin
        .from('profiles')
        .update({
          display_name, phone_number, cpf, endereco, numero, complemento, cep, cidade, estado,
          banco, agencia, conta, digito_opcional, chave_pix,
        })
        .eq('id', user_id)

      if (profErr) throw profErr

      // Update permissions: delete all + insert new
      if (permissions !== undefined) {
        const { error: delErr } = await admin.from('admin_permissions').delete().eq('user_id', user_id)
        if (delErr) throw delErr

        if (permissions.length) {
          const rows = permissions.map((p: string) => ({ user_id: user_id, permission: p }))
          const { error: insErr } = await admin.from('admin_permissions').insert(rows)
          if (insErr) throw insErr
        }
      }

      return jsonResponse({ success: true })
    }

    if (action === 'delete') {
      const { user_id } = body
      if (!user_id) return errorResponse('user_id é obrigatório')

      // Remove permissions
      await admin.from('admin_permissions').delete().eq('user_id', user_id)
      // Remove role
      await admin.from('user_roles').delete().eq('user_id', user_id).eq('role', 'colaborador')
      // Delete auth user
      const { error: delErr } = await admin.auth.admin.deleteUser(user_id)
      if (delErr) throw delErr

      return jsonResponse({ success: true })
    }

    return errorResponse('Ação inválida. Use: create, update, delete')
  } catch (err) {
    console.error('manage-colaborador error:', err)
    return errorResponse(err.message ?? 'Erro interno', 500)
  }
})
