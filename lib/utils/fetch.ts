import { getSupabaseClient } from '@/lib/supabase/client'

export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const origHeaders = (options.headers || {}) as Record<string, string>

  // Detect FormData bodies so we don't set Content-Type (browser handles it)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  // Start with provided headers (caller can override)
  const headers: Record<string, string> = { ...origHeaders }
  if (!isFormData) headers['Content-Type'] = headers['Content-Type'] || 'application/json'

  // Prefer to attach the client session token when available
  try {
    const supabase = getSupabaseClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const token = (sessionData as any)?.session?.access_token || (sessionData as any)?.access_token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      return fetch(url, { ...options, headers, credentials: options.credentials ?? 'include' })
    }
  } catch (e) {
    // no-op, attempt local fallback
  }

  // LocalStorage fallback (dev): allow an explicitly stored token to be used
  try {
    if (typeof window !== 'undefined') {
      const localToken = window.localStorage.getItem('ADMIN_ACCESS_TOKEN')
      if (localToken) {
        headers['Authorization'] = `Bearer ${localToken}`
        return fetch(url, { ...options, headers, credentials: options.credentials ?? 'include' })
      }
    }
  } catch (e) {
    // ignore storage errors
  }

  // Default: include credentials to allow cookie-based sessions to be forwarded
  return fetch(url, { ...options, headers, credentials: options.credentials ?? 'include' })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
}
