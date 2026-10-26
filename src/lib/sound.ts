"use client";

import type { Usage } from "./types";

/**
 * Son d'échappement : vrais enregistrements public/sounds/voiture.mp3 et moto.mp3
 * (voir public/sounds/CREDITS.md), lus via Web Audio. Si le fichier manque, synthèse d'un démarrage
 * + accélération en secours. Émet `lignerouge:sound` sur window ({ playing, usage }) pour synchroniser
 * les animations (pot qui vibre, braises qui accélèrent).
 */

let ctx: AudioContext | null = null;
let playing = false;

export const SOUND_EVENT = "lignerouge:sound";

export function isPlaying() {
  return playing;
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function distortion(c: AudioContext, amount: number) {
  const ws = c.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  ws.curve = curve;
  ws.oversample = "4x";
  return ws;
}

function audioContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function emit(isOn: boolean, usage: Usage) {
  playing = isOn;
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { playing: isOn, usage } }));
}

type Recording = { buffer: AudioBuffer; offset: number };
const recordings = new Map<string, Promise<Recording | null>>();
const CLIP = 8; // secondes jouées

/** Début de la fenêtre de CLIP secondes la plus énergique (montée en régime, pleine charge). */
function loudestOffset(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0);
  const step = Math.floor(buffer.sampleRate / 4); // blocs de 250 ms
  const rms: number[] = [];
  for (let i = 0; i + step <= data.length; i += step) {
    let sum = 0;
    for (let j = i; j < i + step; j += 8) sum += data[j] * data[j];
    rms.push(sum);
  }
  const win = Math.min(rms.length, CLIP * 4);
  let best = 0;
  let acc = rms.slice(0, win).reduce((a, b) => a + b, 0);
  let max = acc;
  for (let k = win; k < rms.length; k++) {
    acc += rms[k] - rms[k - win];
    if (acc > max) {
      max = acc;
      best = k - win + 1;
    }
  }
  return best / 4;
}

function loadRecording(c: AudioContext, url: string) {
  if (!recordings.has(url)) {
    recordings.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((b) => c.decodeAudioData(b))
        .then((buffer) => ({ buffer, offset: loudestOffset(buffer) }))
        .catch(() => null),
    );
  }
  return recordings.get(url)!;
}

/** Joue le vrai son du pot (voiture ou moto, route ou circuit), ou la synthèse si l'enregistrement manque. */
export async function playExhaust(usage: Usage, vehicle: "voiture" | "moto" = "voiture"): Promise<number> {
  if (playing) return 0;
  const c = audioContext();
  if (!c) return 0;
  playing = true; // verrou pendant le chargement
  const rec = await loadRecording(c, `/sounds/${vehicle}.mp3`);
  if (!rec) {
    playing = false;
    return playSynth(usage);
  }

  const src = c.createBufferSource();
  src.buffer = rec.buffer;
  src.playbackRate.value = usage === "circuit" ? 1.08 : 1; // circuit : un poil plus haut perché
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  const gain = c.createGain();
  const t0 = c.currentTime;
  const dur = Math.min(rec.buffer.duration - rec.offset, CLIP) / src.playbackRate.value;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(1, t0 + 0.05);
  gain.gain.setValueAtTime(1, t0 + dur - 0.6);
  gain.gain.linearRampToValueAtTime(0, t0 + dur);
  src.connect(comp).connect(gain).connect(c.destination);
  src.start(t0, rec.offset);
  src.stop(t0 + dur);
  emit(true, usage);
  src.onended = () => {
    gain.disconnect();
    emit(false, usage);
  };
  return dur;
}

/** Démarrage + accélération synthétisés (secours sans fichier audio). */
function playSynth(usage: Usage): number {
  if (playing) return 0;
  const c = audioContext();
  if (!c) return 0;

  const circuit = usage === "circuit";
  const cyl = circuit ? 4 : 4;
  const maxRpm = circuit ? 8800 : 6800;
  const idle = 900;
  const t0 = c.currentTime + 0.05;
  const dur = 4.6;

  // tr/min -> fréquence d'allumage (Hz)
  const hz = (rpm: number) => (rpm / 60) * (cyl / 2);

  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);

  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 6;
  comp.connect(master);

  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = circuit ? 6 : 3;
  const drive = distortion(c, circuit ? 40 : 14);
  drive.connect(tone);
  tone.connect(comp);

  // Courbe de régime partagée par tous les oscillateurs
  const rpmPoints: [number, number][] = [
    [0, 0], // démarreur
    [0.55, idle * 0.5],
    [0.8, idle * 2.1], // ça démarre
    [1.3, idle],
    [1.55, maxRpm * 0.55], // coup de gaz
    [1.95, idle * 1.1],
    [2.3, idle],
    [3.7, maxRpm], // pleine charge
    [4.0, maxRpm * 0.95],
    [4.6, idle * 1.2],
  ];

  const oscs: OscillatorNode[] = [];
  const voices: { type: OscillatorType; mult: number; gain: number }[] = circuit
    ? [
        { type: "sawtooth", mult: 1, gain: 0.5 },
        { type: "square", mult: 0.5, gain: 0.35 },
        { type: "sawtooth", mult: 2.01, gain: 0.25 },
      ]
    : [
        { type: "sawtooth", mult: 1, gain: 0.45 },
        { type: "square", mult: 0.5, gain: 0.55 },
        { type: "triangle", mult: 0.25, gain: 0.5 },
      ];

  for (const v of voices) {
    const o = c.createOscillator();
    o.type = v.type;
    const g = c.createGain();
    g.gain.value = v.gain;
    o.connect(g).connect(drive);
    o.frequency.setValueAtTime(20, t0);
    for (const [t, rpm] of rpmPoints) {
      if (t === 0) continue;
      o.frequency.linearRampToValueAtTime(Math.max(18, hz(rpm) * v.mult), t0 + t);
    }
    oscs.push(o);
  }

  // Le filtre s'ouvre avec le régime : son plus brillant en haut des tours
  tone.frequency.setValueAtTime(200, t0);
  for (const [t, rpm] of rpmPoints) {
    if (t === 0) continue;
    tone.frequency.linearRampToValueAtTime((circuit ? 400 : 220) + rpm * (circuit ? 0.55 : 0.28), t0 + t);
  }

  // Ronflement de l'échappement : bruit filtré passe-bande
  const noise = c.createBufferSource();
  noise.buffer = noiseBuffer(c, dur + 0.5);
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(300, t0);
  band.frequency.linearRampToValueAtTime(circuit ? 2400 : 1200, t0 + 3.7);
  band.frequency.linearRampToValueAtTime(400, t0 + 4.6);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0, t0);
  ng.gain.linearRampToValueAtTime(0.25, t0 + 0.8);
  ng.gain.linearRampToValueAtTime(0.12, t0 + 2.3);
  ng.gain.linearRampToValueAtTime(circuit ? 0.6 : 0.35, t0 + 3.7);
  ng.gain.linearRampToValueAtTime(0.05, t0 + 4.6);
  noise.connect(band).connect(ng).connect(comp);

  // Démarreur : impulsions de bruit grave
  const starter = c.createBufferSource();
  starter.buffer = noiseBuffer(c, 0.7);
  const sf = c.createBiquadFilter();
  sf.type = "lowpass";
  sf.frequency.value = 500;
  const sg = c.createGain();
  sg.gain.setValueAtTime(0, t0);
  for (let i = 0; i < 7; i++) {
    sg.gain.setValueAtTime(0.5, t0 + i * 0.08);
    sg.gain.setValueAtTime(0.08, t0 + i * 0.08 + 0.04);
  }
  sg.gain.setValueAtTime(0, t0 + 0.6);
  starter.connect(sf).connect(sg).connect(comp);

  // Pétarades au rétrogradage (circuit)
  if (circuit) {
    const pops = c.createBufferSource();
    pops.buffer = noiseBuffer(c, 1);
    const pf = c.createBiquadFilter();
    pf.type = "lowpass";
    pf.frequency.value = 1800;
    const pg = c.createGain();
    pg.gain.setValueAtTime(0, t0);
    [4.05, 4.18, 4.26, 4.41, 4.5].forEach((t, i) => {
      pg.gain.setValueAtTime(i % 2 ? 1.2 : 1.6, t0 + t);
      pg.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.05);
    });
    pops.connect(pf).connect(pg).connect(comp);
    pops.start(t0 + 3.95);
    pops.stop(t0 + dur);
  }

  // Volume général
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(circuit ? 0.75 : 0.6, t0 + 0.4);
  master.gain.setValueAtTime(circuit ? 0.75 : 0.6, t0 + dur - 0.4);
  master.gain.linearRampToValueAtTime(0, t0 + dur);

  oscs.forEach((o) => {
    o.start(t0 + 0.45);
    o.stop(t0 + dur);
  });
  noise.start(t0);
  noise.stop(t0 + dur);
  starter.start(t0);
  starter.stop(t0 + 0.7);

  playing = true;
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { playing: true, usage } }));
  window.setTimeout(() => {
    playing = false;
    master.disconnect();
    window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { playing: false, usage } }));
  }, dur * 1000 + 100);

  return dur;
}
