import { NextResponse } from 'next/server'
import { validateAdminRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const admin = await validateAdminRequest(request)
    if (!admin) return NextResponse.json({ error: 'Not authenticated or not authorized' }, { status: 401 })

    // Try to extract email via provided token or via cookie session.
    // We can attempt to call /auth/v1/user if needed, but to keep this lightweight
    // we'll return the admin row data (username/id).
    return NextResponse.json({ user: { id: admin.id, username: admin.username } })
  } catch (err) {
    console.error('me route error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
