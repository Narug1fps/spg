import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "images";

/* -------------------------------------------------------
   File upload helper
------------------------------------------------------- */
async function uploadFile(file: Blob, folder: string): Promise<string | null> {
  const service = getSupabaseService();
  if (!service) return null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const filename = `${folder}/${Date.now()}_${(file as any).name || "file"}`;

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
   Parse Body
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

/* -------------------------------------------------------
   POST: Create content (service role, bypasses RLS)
------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request);
    const service = getSupabaseService();

    if (!service) {
      return NextResponse.json({ error: "Service client unavailable" }, { status: 500 });
    }

    let image_url: string | null = null;

    if (body.__file) {
      image_url = await uploadFile(body.__file, "contents");
    }

    const payload: any = {
      title: body.title,
      description: body.description || null,
      content: body.content || null,
      category_id: body.category_id,
      is_published: body.is_published === "true" || body.is_published === true,
      display_order: Number.isFinite(Number(body.display_order)) ? Number(body.display_order) : 0,
    };

    // Ensure a non-null `slug` is provided. Generate from the title when missing.
    const slugFromBody = body.slug ? String(body.slug).trim() : ""
    const slugGenerated = body.title
      ? String(body.title)
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "")
      : ""

    payload.slug = slugFromBody || slugGenerated

    if (image_url) payload.image_url = image_url;

    const { data, error } = await (service as any)
      .from("contents")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/contents error:", err);
    return NextResponse.json({ error: err.message || "Failed to create content" }, { status: 400 });
  }
}

/* -------------------------------------------------------
   GET: Fetch contents
------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    // Prefer the service-role client (bypasses RLS) when available.
    // Fall back to the regular server client so public reads still work
    // when `SUPABASE_SERVICE_ROLE_KEY` is not configured (dev environment).
    let service: any = getSupabaseService();
    if (!service) {
      service = await getSupabaseServer();
    }

    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId");
    const slug = url.searchParams.get("slug");

    if (slug) {
      const { data, error } = await (service as any)
        .from("contents")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error && (error as any).code !== "PGRST116") throw error;
      return NextResponse.json(data || null);
    }

    let query = (service as any)
      .from("contents")
      .select("*")
      .order("display_order", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GET /api/contents error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch contents" }, { status: 400 });
  }
}
