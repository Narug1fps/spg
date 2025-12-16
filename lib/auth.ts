import { getSupabaseServer, getSupabaseService } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Simple admin validation - accepts any authenticated Supabase user.
 * Returns user data if token is valid, or null otherwise.
 */
export async function validateAdminRequest(request?: Request) {
  try {
    if (!request) return null

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.slice('Bearer '.length).trim()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey || !token) {
      return null
    }

    const supabase = createClient(url, anonKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData?.user) {
      return null
    }

    const userId = userData.user.id
    const userEmail = userData.user.email

    // Return user data - any authenticated Supabase user is admin
    return {
      id: userId,
      username: userEmail?.split('@')[0] || 'admin',
      email: userEmail,
    }
  } catch (err) {
    console.warn('[validateAdminRequest] Error:', err)
    return null
  }
}
