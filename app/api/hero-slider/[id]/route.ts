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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!supabase) {
      console.warn('Supabase not initialized')
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { id } = await params

    // Get the image URL first
    const { data: imageData, error: fetchError } = await supabase
      .from("hero_slider_images")
      .select("image_url")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    if (imageData?.image_url) {
      // Extract file path from URL
      const url = new URL(imageData.image_url)
      const filePath = url.pathname.split("/storage/v1/object/public/images/")[1]

      if (filePath) {
        // Delete from storage
        await supabase.storage
          .from("images")
          .remove([filePath])
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("hero_slider_images")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting hero slider image:", error)
    return NextResponse.json(
      { error: "Failed to delete hero slider image" },
      { status: 500 }
    )
  }
}
