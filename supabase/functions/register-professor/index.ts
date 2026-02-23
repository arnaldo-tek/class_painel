import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest } from '../_shared/pagarme.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const {
      email, password, nome_professor, telefone, cpf_cnpj, disciplina,
      rua, numero_casa_ap, bairro, cidade, estado, cep,
      banco, agencia, digito_agencia, conta, digito_conta,
      data_nascimento, ddd, account_type,
    } = body

    if (!email || !password) return errorResponse('Email e senha são obrigatórios')
    if (!nome_professor) return errorResponse('Nome é obrigatório')
    if (!cpf_cnpj) return errorResponse('CPF/CNPJ é obrigatório')

    const admin = createSupabaseAdmin()

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

    // Assign professor role
    const { error: roleErr } = await admin
      .from('user_roles')
      .insert({ user_id: userId, role: 'professor' })
    if (roleErr) throw roleErr

    // Create professor profile
    const profileData: Record<string, unknown> = {
      user_id: userId,
      nome_professor,
      email,
      telefone: telefone || null,
      cpf_cnpj: cpf_cnpj || null,
      disciplina: disciplina || null,
      rua: rua || null,
      numero_casa_ap: numero_casa_ap || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
      banco: banco || null,
      agencia: agencia || null,
      digito_agencia: digito_agencia || null,
      conta: conta || null,
      digito_conta: digito_conta || null,
      data_nascimento: data_nascimento || null,
      approval_status: 'em_analise',
    }

    const { data: profData, error: profErr } = await admin
      .from('professor_profiles')
      .insert(profileData)
      .select('id')
      .single()
    if (profErr) throw profErr

    // Register as Pagar.me recipient if bank data is provided
    let pagarme_receiver_id: string | null = null
    if (banco && agencia && conta && digito_conta && cpf_cnpj && rua && cidade && estado) {
      try {
        const cleanDoc = cpf_cnpj.replace(/\D/g, '')
        const isCompany = cleanDoc.length > 11
        const phoneDdd = ddd || (telefone ? telefone.replace(/\D/g, '').slice(0, 2) : '')
        const phoneNumber = telefone ? telefone.replace(/\D/g, '').slice(2) : ''

        const recipient = await pagarmeRequest<{ id: string }>('/recipients', 'POST', {
          name: nome_professor,
          email,
          document: cleanDoc,
          type: isCompany ? 'company' : 'individual',
          default_bank_account: {
            bank: banco,
            branch_number: agencia,
            branch_check_digit: digito_agencia || '',
            account_number: conta,
            account_check_digit: digito_conta,
            type: account_type || 'checking',
            holder_name: nome_professor,
            holder_document: cleanDoc,
            holder_type: isCompany ? 'company' : 'individual',
          },
          ...(phoneDdd && phoneNumber ? {
            phone: { country_code: '55', area_code: phoneDdd, number: phoneNumber },
          } : {}),
          address: {
            street: rua,
            number: numero_casa_ap || 'S/N',
            complement: '',
            neighborhood: bairro || '',
            city: cidade,
            state: estado,
            zip_code: (cep || '').replace(/\D/g, ''),
            country: 'BR',
          },
          ...(data_nascimento ? { birthdate: data_nascimento } : {}),
        })

        pagarme_receiver_id = recipient.id
        await admin
          .from('professor_profiles')
          .update({ pagarme_receiver_id: recipient.id })
          .eq('id', profData.id)
      } catch (pagarmeErr) {
        console.error('Pagar.me recipient registration failed:', pagarmeErr)
      }
    }

    return jsonResponse({ success: true, pagarme_receiver_id })
  } catch (err) {
    console.error('register-professor error:', err)
    return errorResponse(err.message ?? 'Erro interno', 500)
  }
})
