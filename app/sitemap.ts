import { getSupabaseService } from '@/lib/supabase/server'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sbpgoiania.com.br'

function formatDate(d: string | Date | null) {
  if (!d) return new Date().toISOString()
  return new Date(d).toISOString()
}

export default async function sitemap() {
  const staticRoutes = ['/', '/admin']

  let dynamicRoutes: { url: string; lastModified: string }[] = []

  try {
    const supabase = getSupabaseService()
    if (supabase) {
      const { data, error } = await supabase
        .from('contents')
        .select('slug, updated_at')
        .limit(1000)

      if (!error && Array.isArray(data)) {
        dynamicRoutes = data
          .filter((r: any) => r.slug)
          .map((r: any) => ({
            url: `${SITE_URL}/content/${encodeURIComponent(r.slug)}`,
            lastModified: formatDate(r.updated_at),
          }))
      }
    }
  } catch (_) {}

  const staticMapped = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: formatDate(null),
  }))

  return [...staticMapped, ...dynamicRoutes]
}
