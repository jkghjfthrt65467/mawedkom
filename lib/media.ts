import type { Business } from "./types";

export type BusinessMedia = {
  photo?: string;
  avatar?: string;
  coverPhoto?: string;
  galleryPhotos?: string[];
  staff?: Record<string, string>;
  staffGalleries?: Record<string, string[]>;
};

export type MediaOverlay = Record<string, BusinessMedia>;

export function applyMediaOverlay(business: Business, overlay: MediaOverlay | null | undefined): Business {
  const media = overlay?.[business.slug];
  if (!media) return business;
  return {
    ...business,
    photo: media.photo !== undefined ? media.photo : business.photo,
    avatar: media.avatar !== undefined ? media.avatar : business.avatar,
    coverPhoto: media.coverPhoto !== undefined ? media.coverPhoto : business.coverPhoto,
    galleryPhotos: media.galleryPhotos !== undefined ? media.galleryPhotos : business.galleryPhotos,
    staff: (business.staff || []).map((s) => ({
      ...s,
      photo: media.staff && Object.prototype.hasOwnProperty.call(media.staff, s.id) ? media.staff[s.id] : s.photo,
      galleryPhotos:
        media.staffGalleries && Object.prototype.hasOwnProperty.call(media.staffGalleries, s.id)
          ? media.staffGalleries[s.id]
          : s.galleryPhotos,
    })),
  };
}

export function applyMediaToList(list: Business[], overlay: MediaOverlay | null | undefined): Business[] {
  if (!overlay) return list;
  return list.map((b) => applyMediaOverlay(b, overlay));
}
