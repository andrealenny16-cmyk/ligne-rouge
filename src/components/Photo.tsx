"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** Photo produit unique dans public/photos/ (crédits : public/photos/CREDITS.md). */
export function productPhoto(slug: string) {
  return `/photos/${slug}-34.jpg`;
}

/** Image qui bascule sur un repli éventuel, ou se masque, si la photo est absente. */
export default function Photo(props: Omit<ImageProps, "src"> & { src: string; fallback?: string | null }) {
  // Une nouvelle source = un nouvel état (sinon l'ancienne image resterait affichée)
  return <PhotoInner key={props.src} {...props} />;
}

function PhotoInner({ src, alt, fallback = null, ...rest }: Omit<ImageProps, "src"> & { src: string; fallback?: string | null }) {
  const [current, setCurrent] = useState(src);
  const [missing, setMissing] = useState(false);
  const backup = fallback;
  // Pas de photo ni de repli : on n'affiche rien (le fond du conteneur reste visible)
  if (missing) return null;
  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      onError={() => (backup && current !== backup ? setCurrent(backup) : setMissing(true))}
    />
  );
}
