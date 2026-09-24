import { googleMapsEmbedUrl } from "@/lib/maps";

export function GoogleMapEmbed({
  lat,
  lng,
  title,
  className = "h-56 w-full border-0",
}: {
  lat: number;
  lng: number;
  title: string;
  className?: string;
}) {
  return (
    <iframe
      title={title}
      src={googleMapsEmbedUrl(lat, lng)}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
