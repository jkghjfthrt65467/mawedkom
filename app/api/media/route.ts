import { ownerCanEditSlug } from "@/lib/business-server";
import { getMediaOverlay, patchMedia, removeStoredImage } from "@/lib/media-server";
import { actorFromRequest } from "@/lib/upload-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const overlay = await getMediaOverlay();
  return NextResponse.json({ ok: true, overlay });
}

export async function POST(req: Request) {
  const actor = actorFromRequest(req);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "صلاحية تعديل الصور ناقصة." }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    photo?: string;
    avatar?: string;
    coverPhoto?: string;
    galleryPhotos?: string[];
    staffId?: string;
    staffPhoto?: string;
    staffGalleryPhotos?: string[];
    previous?: string;
  };
  const slug = String(body.slug || "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "معرّف المشروع مطلوب." }, { status: 400 });
  }
  if (actor === "owner" && !(await ownerCanEditSlug(slug))) {
    return NextResponse.json({ ok: false, error: "صاحب المشروع يعدّل صور مشروعه فقط." }, { status: 403 });
  }
  if (body.previous && body.previous.startsWith("/uploads/")) {
    const nextPhoto = body.staffId
      ? body.staffPhoto
      : body.avatar !== undefined
        ? body.avatar
        : body.coverPhoto !== undefined
          ? body.coverPhoto
          : body.photo;
    if (nextPhoto !== body.previous) await removeStoredImage(body.previous);
  }
  const overlay = await patchMedia({
    slug,
    photo: body.photo,
    avatar: body.avatar,
    coverPhoto: body.coverPhoto,
    galleryPhotos: body.galleryPhotos,
    staffId: body.staffId,
    staffPhoto: body.staffPhoto,
    staffGalleryPhotos: body.staffGalleryPhotos,
  });
  return NextResponse.json({ ok: true, overlay });
}
