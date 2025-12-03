import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from "@/lib/auth"

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "images"

/* -------------------------------------------------------
   GET — Obtém categoria por ID
-------------------------------------------------------- */
export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  void request
  try {
    const params = await paramsPromise
    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }
}

/* -------------------------------------------------------
   PUT — Atualiza categoria
-------------------------------------------------------- */
export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise

    // Auth
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await getSupabaseServer()

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
          return NextResponse.json(
            { error: upload.error.message },
            { status: 500 }
          )
        }

        const { data: urlData } = service.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filename)

        image_url = urlData.publicUrl
      }
    } else {
      try {
        body = await request.json()
      } catch {
        body = {}
      }
    }

    if (image_url) body.image_url = image_url
    body.updated_at = new Date().toISOString()

    /* -------------------------------------------------------
       Sanitização dos dados permitidos
    -------------------------------------------------------- */
    const allowed: any = {}

    if (body.name !== undefined) allowed.name = String(body.name)
    if (body.slug !== undefined) allowed.slug = String(body.slug)
    if (body.description !== undefined) allowed.description = body.description ?? null
    if (body.type !== undefined) allowed.type = body.type ?? "page"

    if (body.display_order !== undefined) {
      const num = parseInt(String(body.display_order))
      allowed.display_order = Number.isFinite(num) ? num : 0
    }

    if (body.image_url !== undefined) allowed.image_url = body.image_url

    allowed.updated_at = body.updated_at

    /* -------------------------------------------------------
       Atualizar registro (using privileged service client)
    -------------------------------------------------------- */
    const service = getSupabaseService()
    if (!service) {
      console.error('Service role client missing — cannot perform update')
      return NextResponse.json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
    }

    const { data, error } = await service
      .from("categories")
      .update(allowed)
      .eq("id", params.id)
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update category" },
        { status: 500 }
      )
    }

    // Return the updated row if present; otherwise 404
    return NextResponse.json((data && data[0]) || null)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------
   DELETE — Remove categoria
-------------------------------------------------------- */
export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise

    // Auth
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let service = getSupabaseService()
    if (!service) {
      try {
        service = await getSupabaseServer()
      } catch (e) {
        // ignore
      }
    }

    if (!service) {
      console.error('Service role client missing — cannot perform delete')
      return NextResponse.json({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
    }

    const { data, error } = await service
      .from("categories")
      .delete()
      .eq("id", params.id)
      .select()

    if (error) {
      // If the error is a row-level security violation, return 403 to aid debugging
      const msg = (error && (error.message || String(error))) || 'Failed to delete category'
      console.error('Service delete error:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    // Consider delete successful even if `data` is empty — return 204
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    )
  }
}
