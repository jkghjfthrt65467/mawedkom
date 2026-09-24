"use client";

import { GalleryUploader, PhotoUploader } from "@/components/media/PhotoUploader";

export function ImageField({
  label,
  value,
  onChange,
  hint,
  circle,
  slug,
  actor = "owner",
  kind = "project",
  staffId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  circle?: boolean;
  slug: string;
  actor?: "owner" | "admin" | "staff";
  kind?: "project" | "staff" | "avatar" | "cover";
  staffId?: string;
}) {
  return (
    <PhotoUploader
      label={label}
      value={value}
      onChange={onChange}
      hint={hint}
      circle={circle}
      slug={slug}
      actor={actor}
      kind={kind}
      staffId={staffId}
    />
  );
}

export function ProjectGalleryField({
  photos,
  onChange,
  slug,
  actor = "owner",
  staffId,
  title,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  slug: string;
  actor?: "owner" | "admin" | "staff";
  staffId?: string;
  title?: string;
}) {
  return <GalleryUploader photos={photos} onChange={onChange} slug={slug} actor={actor} staffId={staffId} title={title} />;
}
