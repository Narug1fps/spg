"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from '@/lib/supabase/client'
import { fetchWithAuth } from '@/lib/utils/fetch'
import { AdminLogin } from "@/components/admin/login"
import AdminDashboard from "@/components/admin/dashboard"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    let mounted = true

    const checkAuth = async () => {
      try {
        const res = await fetchWithAuth('/api/admin/me')
        if (!mounted) return
        setIsAuthenticated(res.ok)
      } catch (err) {
        console.error('Auth check failed', err)
        if (mounted) setIsAuthenticated(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    checkAuth()

    const listener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkAuth()
      }
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
      }
    })

    return () => {
      mounted = false
      try {
        // unsubscribe if available
        // @ts-ignore
        listener?.data?.subscription?.unsubscribe?.()
      } catch {}
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground">Carregando...</div>
      </div>
    )
  }

  return isAuthenticated ? (
    <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
  ) : (
    <AdminLogin onLogin={() => setIsAuthenticated(true)} />
  )
}
