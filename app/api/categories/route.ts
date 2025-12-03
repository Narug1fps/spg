import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "images"

/* -------------------------------------------------------
   GET — Lista categorias ou retorna uma categoria por ID
-------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const id = request.nextUrl.searchParams.get("id") ?? null

    let query = supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })

    // Buscar por ID
    if (id) {
      const { data, error } = await query.eq("id", id).single()
      if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
      return NextResponse.json(data ?? null)
    }

    // Buscar todas
    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("GET /api/categories error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------
   POST — Cria nova categoria
-------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()

    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any = {}
    let image_url: string | undefined

    const contentType = request.headers.get("content-type") || ""

    /* -------------------------------------------------------
       Upload de imagem (multipart/form-data)
    -------------------------------------------------------- */
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      body = Object.fromEntries(form.entries())

      const file = form.get("image") as any

      if (file && typeof file.arrayBuffer === "function") {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const filename = `categories/${Date.now()}_${file.name}`

        const service = getSupabaseService()

        if (!service) {
          return NextResponse.json(
            { error: "Supabase service client not configured" },
            { status: 500 }
          )
        }

        const upload = await service.storage
          .from(STORAGE_BUCKET)
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (upload.error) {
          console.error("Storage upload error:", upload.error)
          return NextResponse.json(
            { error: upload.error.message || "Storage upload failed" },
            { status: 500 }
          )
        }

        const { data: urlData } = service.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filename)

        image_url = urlData.publicUrl
      }
    } else {
      body = await request.json()
    }

    /* -------------------------------------------------------
       Sanitização e validação
    -------------------------------------------------------- */

    const name = body.name ? String(body.name).trim() : ""
    if (!name) {
      return NextResponse.json({ error: "Missing category name" }, { status: 400 })
    }

    const slug =
      body.slug?.trim() ||
      name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")

    let display_order = 0
    if (body.display_order !== undefined) {
      const parsed = parseInt(String(body.display_order))
      display_order = Number.isFinite(parsed) ? parsed : 0
    }

    const insertObj: any = {
      name,
      slug,
      description: body.description ?? null,
      type: body.type ?? "page",
      display_order,
    }

    if (image_url) insertObj.image_url = image_url

    /* -------------------------------------------------------
       Inserção no Supabase
    -------------------------------------------------------- */

    const service = getSupabaseService()
    if (!service) {
      console.error('Service role client missing — cannot create category')
      return NextResponse.json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
    }

    const { data, error } = await service
      .from("categories")
      .insert([insertObj])
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create category" },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error("POST /api/categories error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    )
  }
}
