import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { validateAdminRequest } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'images'

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  void request
  try {
    const params = await paramsPromise
    const supabase = await getSupabaseServer()
    // Dev id handling: read local file when service client not available
    if (params.id && params.id.startsWith('dev-') && process.env.NODE_ENV !== 'production' && !getSupabaseService()) {
      try {
        const dataPath = path.resolve(process.cwd(), 'data', 'dev-highlights.json')
        const raw = await fs.readFile(dataPath, 'utf-8')
        const arr = JSON.parse(raw || '[]')
        const item = arr.find((c: any) => c.id === params.id)
        if (!item) return NextResponse.json({ error: 'Highlight not found' }, { status: 404 })
        return NextResponse.json(item)
      } catch (err) {
        return NextResponse.json({ error: 'Highlight not found' }, { status: 404 })
      }
    }

    const { data, error } = await supabase
      .from("highlights")
      .select("*, categories(id, name, slug)")
      .eq("id", params.id)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Highlight not found" }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  try {
    const params = await paramsPromise
    const supabase = await getSupabaseServer()
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    let body: any = {}
    let image_url: string | undefined = undefined
    const contentType = request.headers.get('content-type') || ''
    const service = getSupabaseService()

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      body = Object.fromEntries(form.entries())
      const file = form.get('image') as any
      if (file && typeof file.arrayBuffer === 'function') {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const filename = `highlights/${Date.now()}_${file.name}`
          const uploadClient = service || supabase
          try {
            const uploadRes = await uploadClient.storage.from(STORAGE_BUCKET).upload(filename, buffer, { contentType: file.type, upsert: false })
            if (uploadRes.error) {
              image_url = `data:${file.type};base64,${buffer.toString('base64')}`
            } else {
              const { data: urlData } = uploadClient.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
              image_url = urlData.publicUrl
            }
          } catch (err) {
            image_url = `data:${file.type};base64,${buffer.toString('base64')}`
          }
        } catch (err) {}
      }
    } else {
      body = await request.json()
    }

    if (image_url) body.image_url = image_url
    body.updated_at = new Date().toISOString()

    // Dev id handling: operate on local JSON file
    if (params.id && params.id.startsWith('dev-') && process.env.NODE_ENV !== 'production' && !service) {
      const dataPath = path.resolve(process.cwd(), 'data', 'dev-highlights.json')
      try {
        const raw = await fs.readFile(dataPath, 'utf-8')
        let arr = JSON.parse(raw || '[]')
        const idx = arr.findIndex((c: any) => c.id === params.id)
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], ...body }
          await fs.writeFile(dataPath, JSON.stringify(arr, null, 2), 'utf-8')
          return NextResponse.json(arr[idx])
        }
        return NextResponse.json({ error: 'Highlight not found' }, { status: 404 })
      } catch (err) {
        return NextResponse.json({ error: 'Failed to update dev highlight' }, { status: 500 })
      }
    }

    const { data, error } = await supabase.from("highlights").update(body).eq("id", params.id).select()

    if (error) throw error
    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update highlight" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  try {
    const params = await paramsPromise
    const supabase = await getSupabaseServer()
    const admin = await validateAdminRequest(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Dev mode: delete from local JSON file
    if (process.env.NODE_ENV !== 'production' && !getSupabaseService()) {
      try {
        const dataPath = path.resolve(process.cwd(), 'data', 'dev-highlights.json')
        const raw = await fs.readFile(dataPath, 'utf-8')
        let arr = JSON.parse(raw || '[]')
        const idx = arr.findIndex((c: any) => c.id === params.id)
        if (idx >= 0) {
          arr.splice(idx, 1)
          await fs.writeFile(dataPath, JSON.stringify(arr, null, 2), 'utf-8')
          return NextResponse.json({ success: true })
        }
        throw new Error('Highlight not found')
      } catch (err) {
        const devMsg = String((err as any)?.message || err)
        return NextResponse.json({ error: devMsg }, { status: 500 })
      }
    }

    const { error } = await supabase.from("highlights").delete().eq("id", params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete highlight" }, { status: 500 })
  }
}
