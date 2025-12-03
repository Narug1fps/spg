import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import fs from 'fs/promises'
import path from 'path'
import { type NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from '@/lib/auth'

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'images'

export async function GET(request: NextRequest) {
  void request
  try {
    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
      .from("highlights")
      .select("*, categories(id, name, slug)")
      .eq("is_published", true)
      .eq("featured", true)
      .order("display_order")
      .limit(5)

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch highlights" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const service = getSupabaseService()
    // Accept JSON or multipart/form-data with optional image
    let body: any = {}
    let image_url: string | undefined = undefined
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      body = Object.fromEntries(form.entries())
      const file = form.get('image') as any
      if (file && typeof file.arrayBuffer === 'function') {
          try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const filename = `highlights/${Date.now()}_${file.name}`
            // Prefer service client for uploads
            const uploadClient = service || supabase
            try {
              const uploadRes = await uploadClient.storage.from(STORAGE_BUCKET).upload(filename, buffer, { contentType: file.type, upsert: false })
              if (uploadRes.error) {
                if (service) {
                  return NextResponse.json({ error: uploadRes.error.message || 'Storage upload failed' }, { status: 500 })
                }
                image_url = `data:${file.type};base64,${buffer.toString('base64')}`
              } else {
                const { data: urlData } = uploadClient.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
                image_url = urlData.publicUrl
              }
            } catch (err) {
              if (service) {
                return NextResponse.json({ error: String((err as any)?.message || err) }, { status: 500 })
              }
              image_url = `data:${file.type};base64,${buffer.toString('base64')}`
            }
        } catch (err) {}
      }
    } else {
      body = await request.json()
    }

    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const insertObj: any = { ...body, slug: body.title ? String(body.title).toLowerCase().replace(/\s+/g, "-") : body.slug }
    if (image_url) insertObj.image_url = image_url

    // DEV fallback: write to data/dev-highlights.json when service client not available
    const DEV_ALLOWED = process.env.NODE_ENV !== 'production' && !service
    if (DEV_ALLOWED) {
      const dataDir = path.resolve(process.cwd(), 'data')
      try { await fs.mkdir(dataDir, { recursive: true }) } catch {}
      const dataPath = path.join(dataDir, 'dev-highlights.json')
      let arr: any[] = []
      try { const raw = await fs.readFile(dataPath, 'utf-8'); arr = JSON.parse(raw || '[]') } catch {}
      const id = `dev-${Date.now()}`
      const now = new Date().toISOString()
      const toInsert = { id, created_at: now, updated_at: now, ...insertObj }
      arr.push(toInsert)
      try { await fs.writeFile(dataPath, JSON.stringify(arr, null, 2), 'utf-8'); return NextResponse.json(toInsert, { status: 201 }) } catch (err) { return NextResponse.json({ error: 'Failed to write dev data' }, { status: 500 }) }
    }

    const client = service || supabase
    const { data, error } = await client
      .from("highlights")
      .insert([insertObj])
      .select()

    if (error) throw error
    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: "Failed to create highlight" }, { status: 500 })
  }
}
