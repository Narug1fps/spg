import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  // Ensure environment variables are present before creating the client.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    console.warn('Supabase credentials not configured')
    // Return a minimal dummy client object so callers receive a non-null value
    // This avoids widespread `possibly null` TypeScript errors in route files.
    // At runtime any attempted operation will throw with a clear message.
    const thrower = () => {
      throw new Error('Supabase not configured')
    }
    const dummy = new Proxy(
      {},
      {
        get() {
          return thrower
        },
      }
    )
    return dummy as any
  }

  // NOTE: server uses the anon key for normal server-side requests that run
  // with the current request cookies (session-aware). Privileged operations
  // (bypassing Row Level Security) require the service role key and should
  // be done with `getSupabaseService()` below.
  // Provide the cookie helpers expected by the current Supabase types.
  // Cast to `any` where necessary to avoid mismatches across Next.js versions.
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        try {
          const c = cookieStore.get(name)
          return c ? c.value : null
        } catch {
          return null
        }
      },

      set(name: string, value: string, options?: any) {
        try {
          cookieStore.set(name, value, options)
        } catch {
          // swallow errors
        }
      },

      // Some Next.js versions expose `delete`, others `remove`/`deleteCookie`.
      // Accept both by providing a `delete` implementation that calls the
      // underlying API when available.
      delete(name: string) {
        try {
          // @ts-ignore
          if (typeof cookieStore.delete === 'function') {
            // @ts-ignore
            cookieStore.delete(name)
          } else {
            // Fallback: attempt to set an expired cookie
            cookieStore.set(name, '', { maxAge: 0 })
          }
        } catch {
          // ignore
        }
      },
    } as any,
  })
}

// Returns a supabase client authenticated with the service role key if present.
// This client bypasses RLS and should only be used in secure server environments.
export function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) {
    console.warn('getSupabaseService not configured — NEXT_PUBLIC_SUPABASE_URL missing')
    return null
  }

  if (!serviceKey) {
    console.warn('getSupabaseService not configured — SUPABASE_SERVICE_ROLE_KEY missing')
    return null
  }

  return createClient(url, serviceKey)
}
