"use client";

import { useEffect, useState } from "react";
import { playExhaust, SOUND_EVENT } from "@/lib/sound";
import type { Usage } from "@/lib/types";

export default function SoundButton({ usage, className = "" }: { usage: Usage; className?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const h = (e: Event) => setOn((e as CustomEvent).detail.playing);
    window.addEventListener(SOUND_EVENT, h);
    return () => window.removeEventListener(SOUND_EVENT, h);
  }, []);

  return (
    <button
      type="button"
      onClick={() => playExhaust(usage)}
      disabled={on}
      aria-label={`Écouter le son ${usage === "circuit" ? "circuit" : "route"}`}
      className={`inline-flex items-center gap-2.5 text-sm font-medium underline-offset-4 hover:underline disabled:cursor-wait disabled:no-underline ${className}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full border border-ink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {on ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7L8 5Z" />}
        </svg>
      </span>
      {on ? "Lecture du son…" : "Écouter le son (démarrage + accélération)"}
    </button>
  );
}
