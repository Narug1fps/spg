import { getSupabaseService } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sbpgoiania.com.br'

function formatDate(d: string | Date | null) {
  if (!d) return new Date().toISOString()
  return new Date(d).toISOString()
}

export async function GET() {
  const staticRoutes = ['/', '/admin']
  let dynamicRoutes: string[] = []

  try {
    const supabase = getSupabaseService()
    if (supabase) {
      const { data, error } = await supabase.from('contents').select('slug, updated_at').limit(1000)
      if (!error && Array.isArray(data)) {
        dynamicRoutes = data
          .filter((r: any) => r.slug)
          .map((r: any) => `/content/${encodeURIComponent(r.slug)}`)
      }
    }
  } catch (err) {
    // fallback to static routes only
  }

  const routes = [...staticRoutes, ...dynamicRoutes]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map((route) => {
      return `  <url>\n    <loc>${SITE_URL}${route}</loc>\n    <lastmod>${formatDate(null)}</lastmod>\n  </url>`
    }).join('\n') +
    `\n</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
    },
  })
}
