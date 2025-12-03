import { createClient } from "@supabase/supabase-js"
import { validateAdminRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
let supabase: any = null
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  console.warn('Supabase credentials not configured')
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!supabase) {
      console.warn('Supabase not initialized')
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { images } = await request.json()

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: "Invalid images array" },
        { status: 400 }
      )
    }

    // Update each image's display_order
    const updates = images.map(({ id, display_order }: { id: string; display_order: number }) =>
      supabase
        .from("hero_slider_images")
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
    console.error("Error reordering hero slider images:", error)
    return NextResponse.json(
      { error: "Failed to reorder hero slider images" },
      { status: 500 }
    )
  }
}
