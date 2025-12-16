import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function handleMe(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.slice('Bearer '.length).trim()

    // Try to validate the token directly with Supabase
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      console.error('[api/admin/me] Missing SUPABASE credentials')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(url, anonKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData?.user) {
      console.warn('[api/admin/me] Token validation failed:', userError?.message)
      return NextResponse.json(
        { error: 'Not authenticated or not authorized' },
        { status: 401 }
      )
    }

    const userId = userData.user.id
    const userEmail = userData.user.email

    // Any authenticated Supabase user is considered an administrator
    return NextResponse.json({
      user: {
        id: userId,
        username: userEmail?.split('@')[0] || 'admin',
        email: userEmail,
      },
    })
  } catch (err) {
    console.error('[api/admin/me] Error:', err)
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
  return handleMe(request)
}
