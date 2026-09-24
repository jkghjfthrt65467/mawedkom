"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ADMIN_PIN, MANAGER_PIN, STAFF_PIN } from "@/lib/store-constants";
import { fetchMediaOverlay, setCachedMediaOverlay } from "@/lib/media-client";
import { notifyMediaChanged } from "@/lib/store";
import { showToast } from "@/lib/toast";

type Actor = "owner" | "admin" | "staff";

async function authHeaders(actor: Actor) {
  return {
    "x-nubo-role": actor,
    "x-nubo-pin": actor === "admin" ? ADMIN_PIN : actor === "staff" ? STAFF_PIN : MANAGER_PIN,
  };
}

export async function persistMedia(body: {
  slug: string;
  actor: Actor;
  photo?: string;
  avatar?: string;
  coverPhoto?: string;
  galleryPhotos?: string[];
  staffId?: string;
  staffPhoto?: string;
  staffGalleryPhotos?: string[];
  previous?: string;
}) {
  const res = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders(body.actor)) },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string; overlay?: Record<string, unknown> };
  if (!res.ok || data.ok === false) throw new Error(data.error || "ما انحفظت الصورة.");
  if (data.overlay) setCachedMediaOverlay(data.overlay as Parameters<typeof setCachedMediaOverlay>[0]);
  else {
    notifyMediaChanged();
    void fetchMediaOverlay(true);
  }
}

export function PhotoUploader({
  label,
  value,
  onChange,
  slug,
  actor,
  kind = "project",
  staffId,
  hint,
  circle,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  slug: string;
  actor: Actor;
  kind?: "project" | "staff" | "gallery" | "avatar" | "cover";
  staffId?: string;
  hint?: string;
  circle?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("slug", slug);
      form.set("kind", kind === "staff" ? "staff" : kind === "avatar" ? "avatar" : kind === "cover" ? "cover" : "project");
      if (staffId) form.set("staffId", staffId);
      if (value) form.set("previous", value);
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: await authHeaders(actor),
        body: form,
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "ما قدرنا نرفع الصورة.");
      const url = data.url;
      await persistMedia({
        slug,
        actor,
        previous: value,
        photo: kind === "project" ? url : undefined,
        avatar: kind === "avatar" ? url : undefined,
        coverPhoto: kind === "cover" ? url : undefined,
        staffId: kind === "staff" ? staffId : undefined,
        staffPhoto: kind === "staff" ? url : undefined,
      });
      onChange(url);
      showToast("انحفظت الصورة");
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل رفع الصورة.";
      setError(message);
      showToast(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(await authHeaders(actor)) },
        body: JSON.stringify({ url: value, slug }),
      });
      await persistMedia({
        slug,
        actor,
        previous: value,
        photo: kind === "project" ? "" : undefined,
        avatar: kind === "avatar" ? "" : undefined,
        coverPhoto: kind === "cover" ? "" : undefined,
        staffId: kind === "staff" ? staffId : undefined,
        staffPhoto: kind === "staff" ? "" : undefined,
      });
      onChange("");
      showToast("انحذفت الصورة");
    } catch (err) {
      const message = err instanceof Error ? err.message : "ما قدرنا نحذف الصورة.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex flex-wrap items-start gap-4">
        <button
          type="button"
          className={`relative overflow-hidden border border-line bg-surface/80 ${
            circle ? "h-28 w-28 rounded-full" : "h-32 w-44 rounded-3xl"
          } ${busy ? "opacity-60" : ""}`}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center gap-1 text-xs text-muted">
              <Icon name="image" className="h-6 w-6" />
              رفع صورة
            </span>
          )}
        </button>
        <div className="min-w-52 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="nubo-btn nubo-btn-primary text-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
              {value ? "تبديل الصورة" : "رفع صورة"}
            </button>
            {value && (
              <button type="button" className="nubo-btn nubo-btn-ghost text-sm text-terracotta" disabled={busy} onClick={() => void remove()}>
                حذف الصورة
              </button>
            )}
          </div>
          {hint && <p className="text-xs leading-6 text-muted">{hint}</p>}
          {busy && <p className="text-xs text-gold">نرفع الصورة…</p>}
          {error && <p className="text-xs text-terracotta">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function GalleryUploader({
  photos,
  onChange,
  slug,
  actor,
  staffId,
  title = "معرض صور المشروع",
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  slug: string;
  actor: Actor;
  staffId?: string;
  title?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function add(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("slug", slug);
      form.set("kind", staffId ? "staff" : "project");
      if (staffId) form.set("staffId", staffId);
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: await authHeaders(actor),
        body: form,
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "ما قدرنا نرفع الصورة.");
      const next = [...photos, data.url];
      await persistMedia(
        staffId ? { slug, actor, staffId, staffGalleryPhotos: next } : { slug, actor, galleryPhotos: next },
      );
      onChange(next);
      showToast("انضافت صورة للمعرض");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "فشل رفع صورة المعرض.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(url: string) {
    setBusy(true);
    try {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(await authHeaders(actor)) },
        body: JSON.stringify({ url, slug }),
      });
      const next = photos.filter((p) => p !== url);
      await persistMedia(
        staffId
          ? { slug, actor, staffId, staffGalleryPhotos: next, previous: url }
          : { slug, actor, galleryPhotos: next, previous: url },
      );
      onChange(next);
      showToast("انحذفت صورة المعرض");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <button type="button" className="nubo-btn nubo-btn-ghost text-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          إضافة صورة
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void add(file);
        }}
      />
      {photos.length === 0 ? (
        <p className="text-xs text-muted">
          {staffId ? "ماكو صور بهالبروفايل بعد. ارفع صور شغلك." : "ماكو صور إضافية. الغلاف فوق يكفي، وتكدر تضيف صور للكراسي أو الواجهة."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url) => (
            <div key={url} className="relative overflow-hidden rounded-2xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-28 w-full object-cover" />
              <button
                type="button"
                className="absolute bottom-2 left-2 rounded-full bg-black/70 px-3 py-1 text-[11px] text-ivory"
                disabled={busy}
                onClick={() => void remove(url)}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
