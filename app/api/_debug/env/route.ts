import { NextResponse } from 'next/server'

// Debug route: returns which Supabase-related environment variables are present.
// IMPORTANT: This endpoint only returns boolean flags (presence), never secret values.
export async function GET() {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_STORAGE_BUCKET: !!process.env.SUPABASE_STORAGE_BUCKET,
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    }
    return NextResponse.json(env)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read environment' }, { status: 500 })
  }
}
