"use client";

import type { Usage } from "./types";

/**
 * Synthèse d'un démarrage + accélération en Web Audio API (aucun fichier externe).
 * Route : plus grave et filtré. Circuit : plus aigu, saturé, avec pétarades au lever de pied.
 * Émet `decibel:sound` sur window ({ playing, usage }) pour synchroniser les animations.
 */

let ctx: AudioContext | null = null;
let playing = false;

export const SOUND_EVENT = "decibel:sound";

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

export function playExhaust(usage: Usage): number {
  if (playing) return 0;
  if (typeof window === "undefined") return 0;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return 0;
  ctx ??= new AC();
  const c = ctx;
  if (c.state === "suspended") void c.resume();

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
