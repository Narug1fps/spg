import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseService } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // If the client provides a Bearer token, validate it and return admin info.
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim()
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && anonKey && token) {
        try {
          const tmp = createClient(url, anonKey)
          const { data: userData, error: userErr } = await tmp.auth.getUser(token)
          if (userErr || !userData?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
          }

          const userId = userData.user.id
          const service = getSupabaseService()
          if (!service) return NextResponse.json({ error: 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })

          const { data: adminRow, error: adminErr } = await service
            .from('admins')
            .select('id, username')
            .eq('id', userId)
            .maybeSingle()

          if (adminErr) return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 })
          if (!adminRow) return NextResponse.json({ error: 'Usuário não autorizado como administrador' }, { status: 403 })

          return NextResponse.json({ user: { id: adminRow.id, username: adminRow.username, email: userData.user.email || null } })
        } catch (e) {
          console.error('Exception validating bearer token:', e)
          return NextResponse.json({ error: 'Erro ao validar token' }, { status: 500 })
        }
      }
    }
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || '').trim()
    const password = String(body?.password || '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    // Use the server-side supabase client (anon key + cookie store) to
    // perform sign-in. This avoids JWTs and service role keys; it relies
    // on standard Supabase auth and cookie-based sessions.
    // Ensure Supabase credentials exist before creating the server client so
    // we don't attempt to use a dummy proxy that will throw at runtime.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      console.error('Supabase credentials not configured')
      return NextResponse.json({ error: 'Configuração do Supabase ausente no servidor' }, { status: 500 })
    }

    const supabase = await getSupabaseServer()

    let authData: any = null
    try {
      const signRes = await supabase.auth.signInWithPassword({ email, password })
      authData = signRes.data
      const authError = signRes.error
      if (authError || !authData?.user) {
        console.error('Auth error:', authError?.message || authError, 'authData:', authData)
        return NextResponse.json({ error: 'Email ou senha incorretos', detail: process.env.NODE_ENV !== 'production' ? (authError?.message || String(authError)) : undefined }, { status: 401 })
      }
    } catch (e) {
      console.error('Exception during signInWithPassword:', e)
      return NextResponse.json({ error: 'Erro autenticando usuário', detail: process.env.NODE_ENV !== 'production' ? String(e) : undefined }, { status: 500 })
    }

    const userId = authData.user.id

    // Verify the user exists in the `admins` table using the privileged service client.
    const service = getSupabaseService()
    if (!service) {
      console.error('Service role client not configured — cannot verify admin membership')
      return NextResponse.json({ error: 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const { data: adminRow, error: adminErr } = await service
      .from('admins')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()

    if (adminErr) {
      console.error('Admin check error (service):', adminErr)
      return NextResponse.json({ error: 'Erro ao verificar permissões', detail: process.env.NODE_ENV !== 'production' ? String(adminErr) : undefined }, { status: 500 })
    }

    if (!adminRow) {
      console.error('User not in admins table:', userId)

      // Allow self-provisioning in development or when explicitly enabled.
      const allowSelfCreate = process.env.NODE_ENV !== 'production' || process.env.ALLOW_SELF_ADMIN_CREATE === '1'
      if (allowSelfCreate) {
        try {
          const username = authData.user?.email || userId
          const insertObj: any = { id: userId, username, password: '' }
          const insertRes = await service.from('admins').insert(insertObj).select().maybeSingle()
          if (insertRes.error) {
            console.error('Failed to insert admin row (self-provision, service):', insertRes.error)
            return NextResponse.json({ error: 'Erro ao verificar permissões', detail: process.env.NODE_ENV !== 'production' ? String(insertRes.error) : undefined }, { status: 500 })
          }
          const created = insertRes.data
          return NextResponse.json({ user: { id: created?.id || userId, username: created?.username || username, email: authData.user?.email || null } })
        } catch (e) {
          console.error('Self-provision admin failed (service):', e)
          return NextResponse.json({ error: 'Erro ao verificar permissões', detail: process.env.NODE_ENV !== 'production' ? String(e) : undefined }, { status: 500 })
        }
      }

      return NextResponse.json({ error: 'Usuário não autorizado como administrador' }, { status: 403 })
    }

    // Success — server client will have set cookies for the session.
    // Also return the access token to the client for environments where
    // cookie-based sessions are not available (local dev). The client may
    // store this token and send it as a Bearer header for subsequent admin
    // requests.
    const accessToken = (authData?.session as any)?.access_token || null
    return NextResponse.json({ user: { id: adminRow.id, username: adminRow.username, email }, access_token: accessToken })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}
