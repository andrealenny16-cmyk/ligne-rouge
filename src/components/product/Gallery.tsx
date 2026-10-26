"use client";

import { useState } from "react";
import Photo from "@/components/Photo";
import type { ProductImage } from "@/lib/types";

const VIEW_LABEL = ["Vue 3/4 avant", "Vue de profil", "Monté sur véhicule"];

export default function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [i, setI] = useState(0);
  const current = images[i];
  return (
    <div>
      <div className="photo relative aspect-[4/3] overflow-hidden rounded-md">
        {current && <Photo src={current.url} alt={current.alt ?? name} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />}
        <span className="absolute bottom-3 left-3 rounded-sm bg-black/60 px-2 py-1 text-[0.7rem] font-medium text-white/70">{VIEW_LABEL[current?.position ?? 0]}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {images.map((img, k) => (
          <button
            key={img.url}
            onClick={() => setI(k)}
            aria-label={VIEW_LABEL[img.position] ?? `Vue ${k + 1}`}
            className={`photo relative aspect-[4/3] overflow-hidden rounded-md border-2 transition ${k === i ? "border-bronze" : "border-transparent hover:border-white/30"}`}
          >
            <Photo src={img.url} alt="" fill sizes="200px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
