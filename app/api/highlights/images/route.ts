import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from '@/lib/supabase/server'
import { validateAdminRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  void request
  try {
    const supabase = getSupabaseService()
    if (!supabase) {
      // Service not configured (dev env) — return empty array so UI doesn't break
      console.warn('getSupabaseService not configured — returning empty slider images list')
      return NextResponse.json([])
    }

    const { data, error } = await supabase
      .from("slider_images")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error('Query error fetching slider_images:', error)
      // return empty array to avoid client-side crash when backend misconfigured
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching slider images:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const displayOrder = formData.get("display_order") as string

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    // Basic MIME guard: if bucket restricts MIME types it will reject unsupported ones.
    // Provide a clearer message for common unsupported types (e.g. image/x-icon).
    if (imageFile.type === 'image/x-icon') {
      return NextResponse.json({ error: 'Tipo de arquivo "image/x-icon" não é suportado pelo bucket. Converta para PNG/JPEG/WEBP ou permita este MIME nas configurações do bucket.' }, { status: 415 })
    }

    // Upload image to Supabase Storage
    const fileName = `slider-${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const buffer = await imageFile.arrayBuffer()
    // Convert to Node Buffer (supabase-js expects Buffer or Uint8Array in Node)
    const fileBuffer = Buffer.from(buffer)

    const supabase = getSupabaseService()
    if (!supabase) {
      console.warn('getSupabaseService not configured — cannot upload slider image')
      return NextResponse.json({ error: 'Supabase service not configured' }, { status: 500 })
    }

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(`slider/${fileName}`, fileBuffer, {
        contentType: imageFile.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      // If bucket is missing or storage not configured, return a helpful message
      const msg = (uploadError as any)?.message || ''
      const statusCode = (uploadError as any)?.status || (uploadError as any)?.statusCode
      if (msg.includes('Bucket not found') || statusCode === 404) {
        return NextResponse.json({ error: 'Storage bucket "images" not found. Create the bucket in Supabase storage or adjust the code to use an existing bucket.' }, { status: 500 })
      }

      // Common Supabase storage rejection for restricted mime types returns 415.
      if (statusCode === 415 || msg.toLowerCase().includes('mime type')) {
        return NextResponse.json({ error: `Tipo MIME não suportado pelo bucket: ${imageFile.type}. Ajuste as configurações do bucket para permitir este tipo, ou envie PNG/JPEG/WEBP.` }, { status: 415 })
      }

      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("images")
      .getPublicUrl(`slider/${fileName}`)

    // Create database record
    const { data, error } = await supabase
      .from("slider_images")
      .insert({
        image_url: publicUrl.publicUrl,
        display_order: parseInt(displayOrder) || 0,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || {}, { status: 201 })
  } catch (error) {
    console.error("Error creating slider image:", error)
    return NextResponse.json(
      { error: "Failed to create slider image" },
      { status: 500 }
    )
  }
}
