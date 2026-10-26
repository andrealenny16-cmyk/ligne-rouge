"use client";

import type { Usage } from "./types";

/**
 * Sons d'échappement LIGNE ROUGE : 4 fichiers synthétisés par simulation moteur (scripts/gen-sounds.py),
 * public/sounds/{voiture|moto}-{ville|circuit}.m4a, lus via Web Audio.
 * `soundLevel()` donne le niveau instantané (0–1) pour faire vibrer le pot du hero au rythme du moteur.
 * Émet `lignerouge:sound` sur window ({ playing, key }) pour synchroniser les boutons.
 */

export type SoundVehicle = "voiture" | "moto";
export const SOUND_EVENT = "lignerouge:sound";

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let current: { src: AudioBufferSourceNode; key: string } | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const probe = new Float32Array(1024);

const keyOf = (vehicle: SoundVehicle, usage: Usage) => `${vehicle}-${usage === "circuit" ? "circuit" : "ville"}`;

function audio() {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function load(c: AudioContext, key: string) {
  if (!buffers.has(key)) {
    buffers.set(
      key,
      fetch(`/sounds/${key}.m4a`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((b) => c.decodeAudioData(b))
        .catch(() => null),
    );
  }
  return buffers.get(key)!;
}

function emit(playing: boolean, key: string) {
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { playing, key } }));
}

export function stopExhaust() {
  if (!current) return;
  const { src, key } = current;
  current = null;
  src.onended = null;
  src.stop();
  emit(false, key);
}

/** Lance le son du pot (un seul à la fois). Re-cliquer sur le même son l'arrête. */
export async function playExhaust(vehicle: SoundVehicle, usage: Usage) {
  const c = audio();
  if (!c || !analyser) return;
  const key = keyOf(vehicle, usage);
  const same = current?.key === key;
  stopExhaust();
  if (same) return;
  const buf = await load(c, key);
  if (!buf) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(analyser);
  src.onended = () => {
    if (current?.src === src) {
      current = null;
      emit(false, key);
    }
  };
  current = { src, key };
  src.start();
  emit(true, key);
}

export function isPlayingKey(vehicle: SoundVehicle, usage: Usage) {
  return current?.key === keyOf(vehicle, usage);
}

/** Niveau RMS instantané du son en cours (0 si silence). */
export function soundLevel() {
  if (!analyser || !current) return 0;
  analyser.getFloatTimeDomainData(probe);
  let s = 0;
  for (let i = 0; i < probe.length; i++) s += probe[i] * probe[i];
  return Math.min(1, Math.sqrt(s / probe.length) * 3);
}

export { keyOf as soundKey };
