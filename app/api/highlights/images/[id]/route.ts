import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from '@/lib/supabase/server'
import { validateAdminRequest } from '@/lib/auth'

// using getSupabaseService() below

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const supabase = getSupabaseService()
    if (!supabase) {
      console.warn('getSupabaseService not configured — cannot delete slider image')
      return NextResponse.json({ error: 'Supabase service not configured' }, { status: 500 })
    }

    // Get the image URL first
    const { data: imageData, error: fetchError } = await supabase
      .from("slider_images")
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
        await supabase.storage.from("images").remove([filePath])
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("slider_images")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting slider image:", error)
    return NextResponse.json(
      { error: "Failed to delete slider image" },
      { status: 500 }
    )
  }
}
