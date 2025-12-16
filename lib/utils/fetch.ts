import { getSupabaseClient } from '@/lib/supabase/client'

export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const origHeaders = (options.headers || {}) as Record<string, string>

  // Detect FormData bodies so we don't set Content-Type (browser handles it)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  // Start with provided headers (caller can override)
  const headers: Record<string, string> = { ...origHeaders }
  if (!isFormData) headers['Content-Type'] = headers['Content-Type'] || 'application/json'

  try {
    const supabase = getSupabaseClient()
    
    // Tenta pegar a sessão ativa do Supabase Client
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    } else {
      // Fallback: Tenta pegar do LocalStorage se o cliente do Supabase ainda não carregou
      if (typeof window !== 'undefined') {
        const localToken = window.localStorage.getItem('ADMIN_ACCESS_TOKEN') || 
                           window.localStorage.getItem('sb-access-token') // Chave padrão comum
        if (localToken) {
          headers['Authorization'] = `Bearer ${localToken}`
        }
      }
    }
  } catch (e) {
    console.error("Erro ao obter token de sessão:", e)
  }

  // Default: include credentials to allow cookie-based sessions to be forwarded
  // Enviamos tanto o Header (Bearer) quanto os Cookies (include) para cobrir todas as bases
  return fetch(url, { 
    ...options, 
    headers, 
    credentials: options.credentials ?? 'include' 
  })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
} 