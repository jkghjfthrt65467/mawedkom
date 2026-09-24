import { getManagedBusinessFromDisk, saveManagedBusinessToDisk } from "./business-server";
import type { BusinessMedia, MediaOverlay } from "./media";
import { readDoc, writeDoc } from "./persist";
import { deleteUploadFile } from "./upload-server";

const KEY = "media";

async function readOverlay(): Promise<MediaOverlay> {
  const parsed = await readDoc<MediaOverlay | null>(KEY, null);
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

async function writeOverlay(overlay: MediaOverlay): Promise<MediaOverlay> {
  await writeDoc(KEY, overlay);
  return overlay;
}

export async function getMediaOverlay(): Promise<MediaOverlay> {
  return readOverlay();
}

export type MediaPatch = {
  slug: string;
  photo?: string;
  avatar?: string;
  coverPhoto?: string;
  galleryPhotos?: string[];
  staffId?: string;
  staffPhoto?: string;
  staffGalleryPhotos?: string[];
};

export async function patchMedia(patch: MediaPatch): Promise<MediaOverlay> {
  const overlay = await readOverlay();
  const current: BusinessMedia = { ...(overlay[patch.slug] || {}) };
  if (patch.photo !== undefined) current.photo = patch.photo;
  if (patch.avatar !== undefined) current.avatar = patch.avatar;
  if (patch.coverPhoto !== undefined) current.coverPhoto = patch.coverPhoto;
  if (patch.galleryPhotos !== undefined) current.galleryPhotos = patch.galleryPhotos;
  if (patch.staffId) {
    if (patch.staffPhoto !== undefined) {
      current.staff = { ...(current.staff || {}) };
      current.staff[patch.staffId] = patch.staffPhoto || "";
    }
    if (patch.staffGalleryPhotos !== undefined) {
      current.staffGalleries = { ...(current.staffGalleries || {}) };
      current.staffGalleries[patch.staffId] = patch.staffGalleryPhotos;
    }
  }
  overlay[patch.slug] = current;
  await writeOverlay(overlay);

  const biz = await getManagedBusinessFromDisk(patch.slug);
  if (biz) {
    const next = { ...biz };
    if (patch.photo !== undefined) next.photo = patch.photo;
    if (patch.avatar !== undefined) next.avatar = patch.avatar;
    if (patch.coverPhoto !== undefined) next.coverPhoto = patch.coverPhoto;
    if (patch.galleryPhotos !== undefined) next.galleryPhotos = patch.galleryPhotos;
    if (patch.staffId) {
      next.staff = next.staff.map((s) => {
        if (s.id !== patch.staffId) return s;
        return {
          ...s,
          photo: patch.staffPhoto !== undefined ? patch.staffPhoto || "" : s.photo,
          galleryPhotos: patch.staffGalleryPhotos !== undefined ? patch.staffGalleryPhotos : s.galleryPhotos,
        };
      });
    }
    await saveManagedBusinessToDisk(next);
  }

  return overlay;
}

export async function removeStoredImage(url: string | undefined) {
  if (url && url.startsWith("/uploads/")) await deleteUploadFile(url);
}
