import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 2. Security Check: Verify if requester is ADMIN
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user: requestUser },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !requestUser) {
      throw new Error('Invalid token')
    }

    const { data: requestUserProfile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', requestUser.id)
        .single()

    if (profileError || requestUserProfile?.role !== 'ADMIN') {
      // Log unauthorized attempt
      await supabaseAdmin.rpc('log_security_notification', {
        p_type: 'UNAUTHORIZED_ACCESS',
        p_message: `Usuário ${requestUser.email} tentou criar um novo usuário sem permissão de ADMIN.`,
        p_severity: 'WARNING',
        p_user_id: requestUser.id,
      })

      return new Response(
        JSON.stringify({ error: 'Forbidden: Requires ADMIN role' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      )
    }

    // 3. Parse request body
    const { email, password, name, role, status, cargo_id, cpf, unidade } =
      await req.json()

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // 4. Create the user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    const userId = authData.user.id

    // 5. Update the profile with additional details
    const { data: profileData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: role || 'CONSULTA',
        status: status || 'PENDENTE',
        cargo_id,
        cpf,
        unidade,
        name: name || authData.user.user_metadata.name,
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Profile update failed: ${updateError.message}`)
    }

    return new Response(JSON.stringify(profileData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
