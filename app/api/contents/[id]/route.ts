import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/auth";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "images";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* -------------------------------------------------------
   Generic file upload helper (Supabase Storage)
------------------------------------------------------- */
async function uploadFile(file: Blob, folder: string): Promise<string | null> {
  let service = getSupabaseService();
  if (!service) {
    try {
      service = await getSupabaseServer();
    } catch (e) {
      // ignore
    }
  }

  if (!service) return null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  // Garante limpeza do nome do arquivo
  const cleanName = (file as any).name?.replace(/[^a-zA-Z0-9.-]/g, '_') || "file";
  const filename = `${folder}/${Date.now()}_${cleanName}`;

  const { error } = await service.storage
    .from(STORAGE_BUCKET)
    .upload(filename, buffer, {
      contentType: (file as any).type || "application/octet-stream",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = service.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/* -------------------------------------------------------
   Parse Body (JSON or multipart/form-data)
------------------------------------------------------- */
async function parseBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const body: any = Object.fromEntries(form.entries());

    if (form.get("image") instanceof Blob) {
      body.__file = form.get("image") as Blob;
    }
    return body;
  }

  try {
    return await request.json();
  } catch {
    return {};
  }
}

// -------------------------------------------------------------------
// TIPAGEM ÚNICA PARA PARÂMETROS (Next.js 15+ ou anterior)
type ContentParams = { params: Promise<{ id: string }> };
// -------------------------------------------------------------------

/* -------------------------------------------------------
   GET /api/contents/:id
------------------------------------------------------- */
export async function GET(
  request: NextRequest,
  props: ContentParams
) {
  try {
    // CORREÇÃO: Aguardar params (Next.js 15)
    const params = await props.params;
    const rawId = String(params?.id || '');
    
    console.log('[api/contents/[id] GET] received params.id:', rawId);
    
    let decoded = rawId;
    try {
      decoded = decodeURIComponent(rawId);
    } catch {
      decoded = rawId;
    }

    const uuidMatch = decoded.match(UUID_REGEX);
    let id = ''
    if (decoded.startsWith('dev-')) id = decoded
    else if (uuidMatch) id = uuidMatch[0]
    
    console.log('[api/contents/[id] GET] decoded:', decoded, 'extracted id:', id)

    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("contents")
      .select("*, categories(id, name, slug)")
      .eq("id", id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json(data || null);
  } catch (error) {
    console.error("GET /api/contents/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}


/* -------------------------------------------------------
   PUT /api/contents/:id
------------------------------------------------------- */
export async function PUT(
  request: NextRequest,
  props: ContentParams
) {
  try {
    // CORREÇÃO 1: Aguardar params
    const params = await props.params;
    console.log('[api/contents/[id] PUT] received params.id:', params?.id);

    // Estratégia de ID: URL Param > Query String. 
    // REMOVIDO: Leitura do body (request.json) para achar ID, pois quebra upload de arquivo.
    let rawId = params?.id || '';
    if (!rawId) {
      const url = new URL(request.url);
      rawId = url.searchParams.get('id') || '';
    }

    rawId = String(rawId || '');
    let decoded = rawId;
    try { decoded = decodeURIComponent(rawId); } catch {}
    
    const uuidMatch = decoded.match(UUID_REGEX);
    let id = '';
    if (decoded.startsWith('dev-')) id = decoded;
    else if (uuidMatch) id = uuidMatch[0];

    console.log('[api/contents/[id] PUT] decoded:', decoded, 'extracted id:', id);

    if (!id) return NextResponse.json({ error: `Invalid id: '${rawId}'` }, { status: 400 });

    const admin = await validateAdminRequest(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // CORREÇÃO 2: Agora é seguro ler o body pois o stream não foi consumido antes
    const body = await parseBody(request);
    const file = body.__file as Blob | undefined;

    if (file) {
      body.image_url = await uploadFile(file, "contents");
    }

    const allowed: any = {};
    if (body.category_id !== undefined) allowed.category_id = String(body.category_id);
    if (body.title !== undefined) allowed.title = String(body.title);
    if (body.slug !== undefined) allowed.slug = String(body.slug);
    if (body.description !== undefined) allowed.description = body.description || null;
    if (body.content !== undefined) allowed.content = body.content || null;
    if (body.image_url !== undefined) allowed.image_url = body.image_url;
    // Conversão segura de boolean
    if (body.is_published !== undefined) {
        allowed.is_published = String(body.is_published) === "true";
    }

    if (body.display_order !== undefined) {
      const n = Number.parseInt(String(body.display_order));
      allowed.display_order = Number.isFinite(n) ? n : 0;
    }

    if (allowed.category_id !== undefined && !(UUID_REGEX.test(allowed.category_id) || String(allowed.category_id).startsWith('dev-'))) {
      return NextResponse.json({ error: 'Invalid category_id' }, { status: 400 });
    }

    allowed.updated_at = new Date().toISOString();

    let service = getSupabaseService();
    if (!service) {
      try {
        service = await getSupabaseServer();
      } catch (e) {
        // ignore
      }
    }

    if (!service) return NextResponse.json({ error: 'Server misconfiguration', status: 500 });

    const { data, error } = await service
      .from("contents")
      .update(allowed)
      .eq("id", id)
      .select();

    if (error) return NextResponse.json({ error: error.message || 'Failed to update content' }, { status: 500 });

    const updated = data?.[0];
    try {
      if (updated?.slug) revalidatePath(`/content/${updated.slug}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update content" }, { status: 500 });
  }
}



/* -------------------------------------------------------
   DELETE /api/contents/:id
------------------------------------------------------- */
export async function DELETE(
  request: NextRequest,
  props: ContentParams
) {
  try {
    // CORREÇÃO: Aguardar params
    const params = await props.params;
    console.log('[api/contents/[id] DELETE] received params.id:', params?.id);

    let rawId = params?.id || '';
    if (!rawId) {
      const url = new URL(request.url);
      rawId = url.searchParams.get('id') || '';
    }

    // REMOVIDO: Leitura de body fallback
    
    rawId = String(rawId || '');
    let decoded = rawId;
    try { decoded = decodeURIComponent(rawId); } catch {}
    
    const uuidMatch = decoded.match(UUID_REGEX);
    let id = '';
    if (decoded.startsWith('dev-')) id = decoded;
    else if (uuidMatch) id = uuidMatch[0];
    
    console.log('[api/contents/[id] DELETE] decoded:', decoded, 'extracted id:', id);

    if (!id) return NextResponse.json({ error: `Invalid id: '${rawId}'` }, { status: 400 });

    const admin = await validateAdminRequest(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let service = getSupabaseService();
    if (!service) {
      try {
        service = await getSupabaseServer();
      } catch (e) {
        // ignore
      }
    }

    if (!service) return NextResponse.json({ error: 'Server misconfiguration', status: 500 });

    const { data: existingData } = await service.from('contents')
      .select('slug, category_id, image_url')
      .eq('id', id)
      .maybeSingle(); // <--- Linha onde o código parou antes.

    const { error: delErr } = await service.from('contents').delete().eq('id', id);
    if (delErr) return NextResponse.json({ error: delErr.message || 'Failed to delete content' }, { status: 500 });

    if (existingData?.image_url) {
      try {
        const url = new URL(existingData.image_url);
        const parts = url.pathname.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
        const filePath = parts[1];
        if (filePath) {
          await service.storage.from(STORAGE_BUCKET).remove([filePath]);
        }
      } catch {}
    }

    try {
      if (existingData?.slug) revalidatePath(`/content/${existingData.slug}`);
      revalidatePath('/');
    } catch {}

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}