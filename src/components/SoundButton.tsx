"use client";

import { useEffect, useState } from "react";
import { playExhaust, SOUND_EVENT, soundKey, type SoundVehicle } from "@/lib/sound";
import type { Usage } from "@/lib/types";

type Props = { vehicle: SoundVehicle; usage: Usage; label?: string; className?: string };

/** Bouton « Écouter » : joue le son du pot, re-cliquer coupe. */
export default function SoundButton({ vehicle, usage, label = "Écouter le son", className = "" }: Props) {
  const [on, setOn] = useState(false);
  const key = soundKey(vehicle, usage);

  useEffect(() => {
    setOn(false);
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ playing: boolean; key: string }>).detail;
      setOn(d.playing && d.key === key);
    };
    window.addEventListener(SOUND_EVENT, h);
    return () => window.removeEventListener(SOUND_EVENT, h);
  }, [key]);

  return (
    <button
      type="button"
      onClick={() => void playExhaust(vehicle, usage)}
      aria-pressed={on}
      aria-label={`${on ? "Couper" : "Écouter"} le son ${vehicle} ${usage === "circuit" ? "circuit" : "ville"}`}
      className={`inline-flex items-center gap-3 rounded-full border border-current/20 bg-current/[0.06] py-1.5 pl-1.5 pr-5 text-sm font-semibold backdrop-blur transition hover:border-bronze ${className}`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-full ${on ? "bg-heat text-white" : "bg-bronze text-ink"}`}>
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
      {on ? "Couper le son" : label}
    </button>
  );
}
