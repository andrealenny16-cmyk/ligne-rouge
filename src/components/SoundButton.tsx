"use client";

import { useEffect, useState } from "react";
import { playExhaust, preloadExhaust, SOUND_EVENT } from "@/lib/sound";
import type { Usage } from "@/lib/types";

type Props = {
  usage: Usage;
  vehicle?: "voiture" | "moto";
  label?: string;
  /** "auto" : s'adapte au fond (texte clair sur bandeau sombre via la couleur héritée) */
  className?: string;
};

export default function SoundButton({ usage, vehicle = "voiture", label = "Écouter", className = "" }: Props) {
  const [state, setState] = useState<"idle" | "mine" | "other">("idle");

  useEffect(() => {
    preloadExhaust(vehicle);
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as { playing: boolean; usage: Usage; vehicle?: string };
      setState(!d.playing ? "idle" : d.usage === usage && (d.vehicle ?? "voiture") === vehicle ? "mine" : "other");
    };
    window.addEventListener(SOUND_EVENT, h);
    return () => window.removeEventListener(SOUND_EVENT, h);
  }, [usage, vehicle]);

  const on = state === "mine";
  return (
    <button
      type="button"
      onClick={() => void playExhaust(usage, vehicle)}
      disabled={state !== "idle"}
      aria-label={`Écouter le son ${vehicle} ${usage === "circuit" ? "sur circuit" : "en ville"}`}
      className={`group inline-flex items-center gap-3 rounded-full border border-current/20 bg-current/[0.06] py-1.5 pl-1.5 pr-5 text-sm font-semibold backdrop-blur transition hover:border-bronze hover:bg-current/[0.1] disabled:cursor-wait disabled:opacity-60 ${on ? "!opacity-100" : ""} ${className}`}
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
      {on ? "Ça pousse…" : label}
    </button>
  );
}
