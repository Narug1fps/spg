import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseService } from "@/lib/supabase/server"

async function handler(request: NextRequest) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization")

  // Debug: log presence of authorization header
  try {
    console.debug('[api/admin/login] auth header present:', !!authHeader)
  } catch {}

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token não fornecido" },
      { status: 401 }
    )
  }

  const token = authHeader.replace("Bearer ", "").trim()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token)

  try {
    console.debug('[api/admin/login] getUser -> error:', !!userError, 'userId:', userData?.user?.id ?? null)
    if (userError) console.debug('[api/admin/login] getUser error details:', JSON.stringify(userError))
  } catch {}

  if (userError || !userData?.user) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 }
    )
  }

  const service = getSupabaseService()

  if (!service) {
    return NextResponse.json(
      { error: "Service role não configurado" },
      { status: 500 }
    )
  }

  const { data: admin, error: adminError } = await service
    .from("admins")
    .select("id, username")
    .eq("id", userData.user.id)
    .maybeSingle()

  if (adminError) {
    return NextResponse.json(
      { error: "Erro ao verificar admin" },
      { status: 500 }
    )
  }

  if (!admin) {
    return NextResponse.json(
      { error: "Usuário não é admin" },
      { status: 403 }
    )
  }

  return NextResponse.json({
    user: {
      id: admin.id,
      username: admin.username,
      email: userData.user.email,
    },
  })
}

export async function POST(req: NextRequest) {
  return handler(req)
}

export async function GET(req: NextRequest) {
  return handler(req)
}
