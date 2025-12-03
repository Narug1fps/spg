import { createClient } from "@supabase/supabase-js"
import { validateAdminRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from "next/server"

let supabase: any = null

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not configured")
      return null
    }
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

export async function GET(request: NextRequest) {
  void request
  try {
    const supabaseClient = getSupabase()
    
    if (!supabaseClient) {
      console.warn("Supabase not initialized - returning empty array")
      return NextResponse.json([])
    }

    const { data, error } = await supabaseClient
      .from("hero_slider_images")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.warn("Hero slider query error:", error.message)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching hero slider images:", error)
    return NextResponse.json([])
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

    // ensure supabase client is initialized for POST
    const supabaseClient = getSupabase()

    if (!supabaseClient) {
      console.warn("Supabase not initialized - cannot upload image")
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    // Upload image to Supabase Storage
    const fileName = `hero-${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const arrayBuffer = await imageFile.arrayBuffer()
    // Convert ArrayBuffer to a Node-friendly Buffer/Uint8Array before upload.
    // Passing a raw ArrayBuffer can produce a 400 from the Storage API.
    const buffer = typeof Buffer !== 'undefined' ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseClient.storage
      .from("images")
      .upload(`hero/${fileName}`, buffer, {
        contentType: imageFile.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: publicUrl } = supabaseClient.storage
      .from("images")
      .getPublicUrl(`hero/${fileName}`)

    // Create database record
    const { data, error } = await supabaseClient
      .from("hero_slider_images")
      .insert({
        image_url: publicUrl.publicUrl,
        display_order: parseInt(displayOrder) || 0,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || {}, { status: 201 })
  } catch (error) {
    console.error("Error creating hero slider image:", error)
    return NextResponse.json(
      { error: "Failed to create hero slider image" },
      { status: 500 }
    )
  }
}
