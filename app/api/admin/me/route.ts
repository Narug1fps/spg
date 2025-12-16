import { NextResponse } from 'next/server'
import { validateAdminRequest } from '@/lib/auth'

// Adicione esta linha: Força a rota a ser dinâmica para evitar cache de 401
export const dynamic = 'force-dynamic'

async function handleMe(request: Request) {
  try {
    // Log para depuração: verifica se o header está chegando
    const authHeader = request.headers.get('authorization')
    console.log('[API Admin/Me] Verificando auth. Header presente:', !!authHeader)

    // Valida a requisição
    const admin = await validateAdminRequest(request)

    if (!admin) {
      console.warn('[API Admin/Me] validateAdminRequest retornou nulo/falso')
      return NextResponse.json(
        { error: 'Not authenticated or not authorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: admin.id,
        username: admin.username,
      },
    })
  } catch (err) {
    console.error('admin/me route error', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return handleMe(request)
}

export async function POST(request: Request) {
  // Nota: Se você está tentando fazer LOGIN enviando email/senha aqui, está errado.
  // O login deve ser feito via supabase.auth.signInWithPassword() no frontend,
  // e esta rota serve apenas para validar o usuário logado.
  return handleMe(request)
}