"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from '@/lib/supabase/client'
import { fetchWithAuth } from '@/lib/utils/fetch'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft } from "lucide-react"

interface AdminLoginProps {
  onLogin: () => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Use the Supabase client in the browser to sign in.
      const supabase = getSupabaseClient()
      const signRes = await supabase.auth.signInWithPassword({ email, password })
      const authError = (signRes as any)?.error
      const authData = (signRes as any)?.data

      if (authError || !authData?.user) {
        setError(authError?.message || 'Email ou senha incorretos')
        setLoading(false)
        return
      }

      // After client sign-in, validate admin membership server-side by
      // calling the `me` endpoint which uses the service-role client to
      // confirm the `admins` table. `fetchWithAuth` will include the
      // client session token in the Authorization header.
      const res = await fetchWithAuth('/api/admin/me')
      if (!res.ok) {
        // Sign out locally to clear the session and show error
        try {
          await supabase.auth.signOut()
        } catch {}
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || 'Acesso negado')
        setLoading(false)
        return
      }

      onLogin()
    } catch (err) {
      setError("Erro de conexão ao servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute top-6 left-6">
        <Button onClick={() => router.back()} variant="outline" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Admin SPG</h1>
          <p className="text-foreground/60">Acesso restrito ao painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-foreground">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white">
            {loading ? (
              <>
                <Spinner className="mr-2" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-semibold mb-2">💡 Para acessar:</p>
          <p>Use o email e senha da conta de administrador registrada no Supabase.</p>
        </div>
      </div>
    </div>
  )
}
