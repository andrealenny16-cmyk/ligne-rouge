"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/types";

export default function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [i, setI] = useState(0);
  const current = images[i];
  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-[32px] bg-paper">
        {current && (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt ?? name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-contain transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <span className="absolute bottom-4 left-5 font-mono text-[0.65rem] tracking-widest text-black/40">
          {i === 0 ? "VUE 3/4 AVANT" : "VUE DE PROFIL"}
        </span>
      </div>
      <div className="mt-3 flex gap-3">
        {images.map((img, k) => (
          <button
            key={img.url}
            onClick={() => setI(k)}
            aria-label={img.alt ?? `Vue ${k + 1}`}
            className={`relative aspect-[4/3] w-28 overflow-hidden rounded-2xl bg-paper ring-2 transition ${k === i ? "ring-bronze" : "ring-transparent opacity-70 hover:opacity-100"}`}
          >
            <Image src={img.url} alt="" fill sizes="112px" className="object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
}
