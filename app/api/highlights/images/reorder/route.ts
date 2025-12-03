import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from '@/lib/supabase/server'
import { validateAdminRequest } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { images } = await request.json()

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: "Invalid images array" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()
    if (!supabase) {
      console.warn('getSupabaseService not configured — cannot reorder slider images')
      return NextResponse.json({ error: 'Supabase service not configured' }, { status: 500 })
    }

    // Update each image's display_order
    const updates = images.map(({ id, display_order }: { id: string; display_order: number }) =>
      supabase
        .from("slider_images")
        .update({ display_order })
        .eq("id", id)
    )

    const results = await Promise.all(updates)

    const hasError = results.some((result) => result.error)
    if (hasError) {
      throw new Error("Failed to update display order")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering slider images:", error)
    return NextResponse.json(
      { error: "Failed to reorder slider images" },
      { status: 500 }
    )
  }
}
