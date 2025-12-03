"use client"

import { useEffect, useState, ChangeEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { type Category, type Content } from "@/lib/supabase/types"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [allContents, setAllContents] = useState<Content[]>([])
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Array<Content | Category>>([])

  useEffect(() => {
    const abort = new AbortController()
    let mounted = true

    const load = async () => {
      try {
        const r = await fetch('/api/categories', { signal: abort.signal })
        if (r.ok) {
          const data = await r.json()
          if (Array.isArray(data) && mounted) setCategories(data)
        }
      } catch (err) {
        // ignore abort or fetch errors
      }

      try {
        const r2 = await fetch('/api/contents', { signal: abort.signal })
        if (r2.ok) {
          const data = await r2.json()
          if (Array.isArray(data) && mounted) setAllContents(data)
        }
      } catch (err) {
        // ignore
      }
    }

    load()

    return () => {
      mounted = false
      abort.abort()
    }
  }, [])

  // debounce query -> suggestions (search both contents and categories)
  useEffect(() => {
    if (!query) return setSuggestions([])
    const t = setTimeout(() => {
      const q = query.toLowerCase()

      const contentMatches = allContents.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      )

      const categoryMatches = categories.filter(cat =>
        cat.name.toLowerCase().includes(q) ||
        (cat.description || "").toLowerCase().includes(q)
      )

      // Merge results, prioritizing contents then categories, limit to 6
      const merged: Array<Content | Category> = [
        ...contentMatches.slice(0, 4),
        ...categoryMatches.slice(0, 4),
      ].slice(0, 6)

      setSuggestions(merged)
    }, 180)
    return () => clearTimeout(t)
  }, [query, allContents, categories])

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Image
              src="/spg1.png"
              alt="SBPG - Sociedade Brasileira de Psicanálise de Goiânia"
              width={100}
              height={100}
              className="w-20 h-20"
            />
          </Link>

          {/* Desktop Menu (categories driven by admin) */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-foreground hover:text-primary transition font-medium">
              Início
            </Link>
            {categories.length > 0 ? (
              categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/#category-${cat.slug}`}
                  className="text-sm text-foreground hover:text-primary transition font-medium"
                >
                  {cat.name}
                </Link>
              ))
            ) : (
              <span className="text-sm text-foreground/60">Sem categorias</span>
            )}
            <Link href="/admin" className="text-sm text-foreground hover:text-primary transition font-medium">
              Admin
            </Link>
          </div>

          {/* Search and Mobile Menu */}
          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(!searchOpen)} aria-expanded={searchOpen} aria-label="Abrir busca" className="p-2 hover:bg-accent/10 rounded-lg transition">
              <Search className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar (animated) */}
        {searchOpen && (
          <div className="pt-4 pb-4 border-t border-accent/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative">
              <Input
                type="search"
                placeholder="Buscar conteúdo..."
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-accent/5 border-2 border-accent/30 hover:border-accent/50 focus:border-primary/50 focus:outline-none transition-all shadow-md focus:shadow-lg"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                autoComplete="off"
                autoFocus
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 pointer-events-none" />

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-accent/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top duration-200">
                  {suggestions.map((s, idx) => {
                    const isContent = (s as Content).title !== undefined
                    const title = isContent ? (s as Content).title : (s as Category).name
                    const desc = isContent ? (s as Content).description : (s as Category).description
                    const href = isContent ? `/content/${(s as Content).slug}` : `/#category-${(s as Category).slug}`

                    return (
                      <Link
                        key={s.id}
                        href={href}
                        className={`flex items-start gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent/10 transition ${idx !== suggestions.length - 1 ? 'border-b border-accent/10' : ''}`}
                        onClick={() => { setSearchOpen(false); setQuery(""); setSuggestions([]) }}
                      >
                        <Search className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent/60" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-foreground">{title}</div>
                            <div className="text-xs text-foreground/50">{isContent ? 'Conteúdo' : 'Categoria'}</div>
                          </div>
                          {desc && <div className="text-xs text-foreground/50 line-clamp-1 mt-1">{desc}</div>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu (categories driven by admin) */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-accent/20 flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm text-foreground hover:text-primary transition font-medium">
              Início
            </Link>
            {categories.length > 0 ? (
              categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/#category-${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-foreground hover:text-primary transition font-medium"
                >
                  {cat.name}
                </Link>
              ))
            ) : (
              <span className="text-sm text-foreground/60">Sem categorias</span>
            )}
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-sm text-foreground hover:text-primary transition font-medium">
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
