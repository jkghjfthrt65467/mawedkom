import { ownerCanEditSlug } from "@/lib/business-server";
import { getMediaOverlay, patchMedia } from "@/lib/media-server";
import { actorFromRequest, deleteUploadFile, saveUploadFile } from "@/lib/upload-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const actor = actorFromRequest(req);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "صلاحية رفع الصورة ناقصة." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "الملف ما وصل." }, { status: 400 });
  }

  const file = form.get("file");
  const slug = String(form.get("slug") || "").trim();
  const kind = String(form.get("kind") || "project").trim();
  const staffId = String(form.get("staffId") || "").trim();

  if (!slug) {
    return NextResponse.json({ ok: false, error: "معرّف المشروع مطلوب." }, { status: 400 });
  }
  if (actor === "owner" && !(await ownerCanEditSlug(slug))) {
    return NextResponse.json({ ok: false, error: "صاحب المشروع يعدّل صور مشروعه فقط." }, { status: 403 });
  }
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "اختَر صورة أولاً." }, { status: 400 });
  }

  const prefix = kind === "staff" && staffId ? `staff-${slug}-${staffId}` : `project-${slug}`;
  try {
    const url = await saveUploadFile(file, prefix);
    const previous = String(form.get("previous") || "");
    if (previous.startsWith("/uploads/") && previous !== url) {
      await deleteUploadFile(previous);
    }
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ما قدرنا نحفظ الصورة.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const actor = actorFromRequest(req);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "صلاحية الحذف ناقصة." }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { url?: string; slug?: string };
  const url = String(body.url || "");
  const slug = String(body.slug || "").trim();
  if (actor === "owner" && slug && !(await ownerCanEditSlug(slug))) {
    return NextResponse.json({ ok: false, error: "صاحب المشروع يحذف صور مشروعه فقط." }, { status: 403 });
  }
  if (!url.startsWith("/uploads/")) {
    return NextResponse.json({ ok: true, deleted: false });
  }
  const deleted = await deleteUploadFile(url);
  const overlay = await getMediaOverlay();
  const targetSlug = slug || Object.keys(overlay).find((key) => JSON.stringify(overlay[key] || {}).includes(url));
  if (targetSlug && overlay[targetSlug]) {
    const current = overlay[targetSlug];
    const patch: {
      slug: string;
      photo?: string;
      avatar?: string;
      coverPhoto?: string;
      galleryPhotos?: string[];
      staffId?: string;
      staffPhoto?: string;
      staffGalleryPhotos?: string[];
    } = { slug: targetSlug };
    if (current.photo === url) patch.photo = "";
    if (current.avatar === url) patch.avatar = "";
    if (current.coverPhoto === url) patch.coverPhoto = "";
    if ((current.galleryPhotos || []).includes(url)) {
      patch.galleryPhotos = (current.galleryPhotos || []).filter((item) => item !== url);
    }
    const galleryStaff = Object.entries(current.staffGalleries || {}).find(([, photos]) => (photos || []).includes(url));
    if (galleryStaff) {
      patch.staffId = galleryStaff[0];
      patch.staffGalleryPhotos = (galleryStaff[1] || []).filter((item) => item !== url);
    }
    const staffEntry = Object.entries(current.staff || {}).find(([, value]) => value === url);
    if (staffEntry) {
      patch.staffId = staffEntry[0];
      patch.staffPhoto = "";
    }
    if (
      patch.photo !== undefined ||
      patch.avatar !== undefined ||
      patch.coverPhoto !== undefined ||
      patch.galleryPhotos ||
      patch.staffId
    ) {
      await patchMedia(patch);
    }
  }
  return NextResponse.json({ ok: true, deleted });
}
