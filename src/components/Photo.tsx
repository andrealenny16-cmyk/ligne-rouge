"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export type ProductView = "34" | "profil" | "monte";

/** Photo produit dans public/photos/ (voir docs/prompts-photos.md). */
export function productPhoto(slug: string, view: ProductView = "34") {
  return `/photos/${slug}-${view}.jpg`;
}

/** Visuel provisoire tant que la photo n'a pas été déposée. */
export function photoFallback(src: string) {
  const m = src.match(/^\/photos\/(.+)-(34|profil|monte)\.jpg$/);
  if (!m) return null;
  return `/products/${m[1]}-${m[2] === "profil" ? "profil" : "34"}.svg`;
}

/** Image qui bascule sur le visuel provisoire si la photo est absente. */
export default function Photo({ src, alt, fallback, ...rest }: Omit<ImageProps, "src"> & { src: string; fallback?: string | null }) {
  const [current, setCurrent] = useState(src);
  const [missing, setMissing] = useState(false);
  const backup = fallback === undefined ? photoFallback(src) : fallback;
  // Pas de photo ni de repli : on n'affiche rien (le fond du conteneur reste visible)
  if (missing) return null;
  return (
    <Image
      {...rest}
      key={src}
      src={current}
      alt={alt}
      onError={() => (backup && current !== backup ? setCurrent(backup) : setMissing(true))}
    />
  );
}
