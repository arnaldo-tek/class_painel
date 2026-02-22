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

    if (!callerRole) return errorResponse('Apenas admins podem gerenciar professores', 403)

    const body = await req.json()
    const { action } = body

    const admin = createSupabaseAdmin()

    if (action === 'create') {
      const { email, password, nome_professor, telefone, cpf_cnpj, disciplina } = body

      if (!email || !password) return errorResponse('Email e senha são obrigatórios')
      if (!nome_professor) return errorResponse('Nome do professor é obrigatório')

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

      // Add professor role
      const { error: roleErr } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role: 'professor' })

      if (roleErr) throw roleErr

      // Create professor_profiles
      const { error: profErr } = await admin
        .from('professor_profiles')
        .insert({
          user_id: userId,
          nome_professor,
          email,
          telefone: telefone || null,
          cpf_cnpj: cpf_cnpj || null,
          disciplina: disciplina || null,
          approval_status: 'em_analise',
        })

      if (profErr) throw profErr

      return jsonResponse({ user_id: userId })
    }

    return errorResponse('Ação inválida. Use: create')
  } catch (err) {
    console.error('manage-professor error:', err)
    return errorResponse(err.message ?? 'Erro interno', 500)
  }
})
