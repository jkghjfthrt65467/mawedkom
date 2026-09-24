"use client";

import { useEffect, useState } from "react";
import { getFavs, toggleFav } from "@/lib/store";

export function FavoriteButton({ slug }: { slug: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(getFavs().includes(slug));
  }, [slug]);
  return (
    <button
      type="button"
      className="nubo-btn nubo-btn-cover"
      onClick={() => {
        toggleFav(slug);
        setOn(getFavs().includes(slug));
      }}
    >
      {on ? "بالمفضلة" : "أضف للمفضلة"}
    </button>
  );
}
