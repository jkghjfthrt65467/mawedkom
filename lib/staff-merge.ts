import type { Business } from "./types";

export function mergeStaffFromSeed(seed: Business, overlay: Business): Business["staff"] {
  return (overlay.staff || seed.staff).map((s) => {
    const fromSeed = seed.staff.find((x) => x.id === s.id);
    return {
      ...fromSeed,
      ...s,
      bio: s.bio || fromSeed?.bio || "",
      photo: s.photo || fromSeed?.photo || "",
      galleryPhotos: s.galleryPhotos?.length ? s.galleryPhotos : fromSeed?.galleryPhotos || [],
      reviews: s.reviews?.length ? s.reviews : fromSeed?.reviews || [],
    };
  });
}
