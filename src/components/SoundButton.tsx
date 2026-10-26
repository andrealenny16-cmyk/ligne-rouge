"use client";

import { useEffect, useState } from "react";
import { playExhaust, SOUND_EVENT } from "@/lib/sound";
import type { Usage } from "@/lib/types";

export default function SoundButton({ usage, vehicle = "voiture", className = "" }: { usage: Usage; vehicle?: "voiture" | "moto"; className?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const h = (e: Event) => setOn((e as CustomEvent).detail.playing);
    window.addEventListener(SOUND_EVENT, h);
    return () => window.removeEventListener(SOUND_EVENT, h);
  }, []);

  return (
    <button
      type="button"
      onClick={() => void playExhaust(usage, vehicle)}
      disabled={on}
      aria-label={`Écouter le son ${usage === "circuit" ? "circuit" : "route"}`}
      className={`group inline-flex items-center gap-3 rounded-full border border-black/15 bg-black/[0.04] py-2 pl-2 pr-5 text-sm font-semibold backdrop-blur transition hover:border-bronze/60 hover:bg-black/[0.04] disabled:cursor-wait ${className}`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-full ${on ? "bg-heat" : "bg-bronze text-ink"}`}>
        {on ? (
          <span className="flex h-3 items-end gap-[2px]" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-[3px] animate-pulse rounded bg-white" style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 0.12}s` }} />
            ))}
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            <path d="M16 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </span>
      {on ? "Ça pousse…" : "Écouter"}
    </button>
  );
}
