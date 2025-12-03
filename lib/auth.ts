import { getSupabaseServer, getSupabaseService } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Validate the current request/session and return the corresponding admin row
 * from the `admins` table or `null`.
 *
 * This helper supports:
 * - Bearer token in the `Authorization` header (checks via Supabase SDK)
 * - Server cookie-based session via `getSupabaseServer()` (recommended)
 *
 * It uses the privileged service client to verify the `admins` table membership.
 */
export async function validateAdminRequest(request?: Request) {
  try {
    let userId: string | null = null

    // 1) If an Authorization header with a Bearer token is present, prefer it.
    if (request) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length).trim()
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (url && anonKey && token) {
          try {
            const tmp = createClient(url, anonKey)
            const { data, error } = await tmp.auth.getUser(token as string)
            if (!error && data?.user?.id) {
              userId = data.user.id
            }
          } catch (e) {
            // continue to cookie-based fallback
          }
        }
      }
    }

    // 2) Fallback to server cookie session
    if (!userId) {
      try {
        const supabase = await getSupabaseServer()
        // getSession returns { data: { session } }
        const { data: sessionData } = await supabase.auth.getSession()
        // session may be null; handle both shapes
        const sessionAny: any = sessionData
        const user = sessionAny?.session?.user || sessionAny?.user
        if (user && user.id) userId = user.id
      } catch (e) {
        // ignore and proceed to return null
      }
    }

    if (!userId) return null

    // 3) Verify admin membership using the privileged service client
    const service = getSupabaseService()
    if (!service) {
      // In non-production or when service key missing, return a lightweight fallback
      if (process.env.NODE_ENV !== 'production') return { id: userId, username: 'admin' }
      return null
    }

    const { data: adminRow, error: adminError } = await service
      .from('admins')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()

    if (adminError) {
      console.error('Error querying admins table:', adminError)
      return null
    }

    return adminRow || null
  } catch (err) {
    console.error('validateAdminRequest error:', err)
    return null
  }
}
