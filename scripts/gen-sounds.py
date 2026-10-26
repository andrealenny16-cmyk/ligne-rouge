"""Synthèse physique des 4 sons d'échappement LIGNE ROUGE (public/sounds/*.m4a).

Pas d'échantillon : on simule le moteur combustion par combustion.
- Le vilebrequin tourne selon un profil de régime (ralenti, coups de gaz, montée en régime, lâcher).
- Chaque cylindre émet une onde de pression à son angle d'allumage (vrai ordre d'allumage), avec une
  légère irrégularité d'amplitude et de calage d'un cycle à l'autre, comme un vrai moteur.
- L'onde traverse le tube (résonance aller-retour), le silencieux (passe-bas), puis une légère saturation.
- Au lâcher de gaz, les versions circuit pétaradent (post-combustions dans la ligne).

Moteurs : V8 vilebrequin croisé (voiture, deux bancs → glouglou irrégulier), bicylindre calé à 270° (moto ville),
4 cylindres en ligne qui monte à 14 500 tr/min (moto circuit).

Usage : python3 scripts/gen-sounds.py <dossier_wav>   (numpy + scipy), puis conversion en AAC :
afconvert -f m4af -d aac -b 160000 <wav> public/sounds/<nom>.m4a
"""

import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 48_000
C = 343.0  # vitesse du son (m/s), on reste simple


def profile(points):
    """points = [(durée, régime_fin, charge_fin)] → régime et charge échantillon par échantillon (rampes lissées)."""
    rpm, thr = [], []
    r0, t0 = points[0][1], points[0][2]
    for dur, r1, t1 in points:
        n = int(dur * SR)
        s = np.linspace(0, 1, n, endpoint=False)
        ease = s * s * (3 - 2 * s)  # rampe en S
        rpm.append(r0 + (r1 - r0) * ease)
        thr.append(t0 + (t1 - t0) * np.clip(s * 4, 0, 1))  # la charge bascule vite (pédale)
        r0, t0 = r1, t1
    return np.concatenate(rpm), np.concatenate(thr)


def pulse_kernel(tau_ms, rare_ms):
    """Onde de pression d'une bouffée : surpression brève puis dépression plus lente."""
    t = np.arange(int(SR * 0.03)) / SR * 1000
    pos = (t / tau_ms) * np.exp(1 - t / tau_ms)
    neg = (t / rare_ms) * np.exp(1 - t / rare_ms)
    k = pos - 0.45 * neg
    return k / np.abs(k).max()


def comb(x, length_m, refl):
    """Résonance du tube : écho aller-retour réfléchi (bout ouvert → réflexion négative)."""
    d = max(1, int(round(SR * 2 * length_m / C)))
    a = np.zeros(d + 1)
    a[0], a[d] = 1.0, -refl
    return lfilter([1.0], a, x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="low", fs=SR, output="sos"), x)


def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="high", fs=SR, output="sos"), x)


def engine(rpm, thr, banks, p, seed):
    rng = np.random.default_rng(seed)
    n = len(rpm)
    crank = np.cumsum(rpm / 60 * 360 / SR)  # angle vilebrequin en degrés
    decel = np.r_[0, np.diff(rpm)] < 0
    kern = pulse_kernel(p["tau"], p["rare"])
    noise_env = np.exp(-np.arange(int(SR * 0.012)) / (SR * p["noise_decay"]))
    out = np.zeros(n)
    pops = np.zeros(n)
    for b, (angles, length) in enumerate(banks):
        imp = np.zeros(n + 2)
        for phi in angles:
            cycle = np.floor((crank - phi) / 720)
            for i in np.nonzero(np.diff(cycle) > 0)[0]:
                i = i + 1
                jitter = rng.normal(0, p["timing_ms"] / 1000 * SR)
                pos = min(max(i + jitter, 0), n - 1)
                k, frac = int(pos), pos - int(pos)
                load = thr[k]
                amp = (p["idle_amp"] + (1 - p["idle_amp"]) * load) * rng.lognormal(0, p["amp_jitter"])
                if load < 0.15 and rng.random() < p["misfire"]:
                    amp *= 0.25  # combustion faible au ralenti / frein moteur
                imp[k] += amp * (1 - frac)
                imp[k + 1] += amp * frac
                # post-combustion au lâcher de gaz (versions circuit)
                if decel[k] and load < 0.1 and rpm[k] > p["pop_min_rpm"] and rng.random() < p["pop_rate"]:
                    j = k + int(SR * rng.uniform(0.004, 0.02))
                    if j < n - 600:
                        bang = rng.uniform(1.5, 3.5) * p["pop_gain"]
                        pops[j : j + 600] += bang * rng.normal(0, 1, 600) * np.exp(-np.arange(600) / (SR * 0.0025))
                        imp[j] += bang * 0.8
        imp = imp[:n]
        gas = np.convolve(imp, kern)[:n]
        turb = np.convolve(imp, noise_env)[:n] * rng.normal(0, 1, n)
        turb = bandpass(turb, 300, p["noise_hi"]) * p["noise"] * (0.35 + 0.65 * thr)
        out += comb(gas + turb, length, p["refl"])
    pops = comb(pops, banks[0][1], p["refl"] * 0.6)
    # silencieux : passe-bas, avec une part de son direct (rugosité) selon la ligne
    y = lowpass(out, p["muffler_fc"]) * (1 - p["rasp"]) + highpass(out, 1200) * p["rasp"]
    y = y + lowpass(pops, 6000)
    # mécanique / admission discrète qui monte avec le régime
    mech = bandpass(rng.normal(0, 1, n), 2500, 7000) * (rpm / rpm.max()) ** 2 * p["mech"]
    y = highpass(y + mech, 28)
    # niveau calé sur le moteur (pas sur les pétarades), puis saturation douce qui tient les crêtes
    y = y / (np.percentile(np.abs(y), 99.5) + 1e-9)
    y = np.tanh(p["drive"] * 0.55 * y)
    fade = int(SR * 0.04)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade * 4 :] *= np.linspace(1, 0, fade * 4)
    return y / np.abs(y).max() * 0.89


V8_L = [0, 270, 450, 540]  # cylindres 1, 3, 5, 7 (ordre 1-8-4-3-6-5-7-2)
V8_R = [90, 180, 360, 630]  # cylindres 8, 4, 6, 2

BASE = dict(tau=0.7, rare=2.4, noise_decay=0.003, timing_ms=0.12, amp_jitter=0.1, idle_amp=0.35, misfire=0.0,
            noise=0.35, noise_hi=5000, refl=0.55, muffler_fc=900, rasp=0.05, mech=0.015, drive=1.6,
            pop_min_rpm=99_999, pop_rate=0.0, pop_gain=1.0)

SOUNDS = {
    # V8 cat-back à valve : glouglou rond au ralenti, deux coups de gaz, montée, lâcher
    "voiture-ville": (
        [(1.3, 760, 0.05), (0.28, 3300, 1), (0.75, 820, 0.02), (0.35, 800, 0.05), (2.1, 6200, 1), (1.1, 1400, 0.0), (0.7, 780, 0.05), (0.5, 760, 0.05)],
        [(V8_L, 1.55), (V8_R, 1.7)],
        dict(BASE, tau=0.9, rare=3.0, misfire=0.08, amp_jitter=0.14, noise=0.25, muffler_fc=700, rasp=0.04, drive=1.4),
    ),
    # V8 décatalysé circuit : ralenti haché (arbre à cames), coups de gaz secs, rupteur, pétarades au lâcher
    "voiture-circuit": (
        [(1.1, 980, 0.08), (0.2, 4600, 1), (0.5, 1100, 0.0), (0.18, 5600, 1), (0.55, 1100, 0.0), (2.3, 7900, 1), (0.25, 7800, 1), (1.4, 1300, 0.0), (0.6, 980, 0.08)],
        [(V8_L, 1.2), (V8_R, 1.32)],
        dict(BASE, tau=0.55, rare=2.0, misfire=0.2, amp_jitter=0.18, noise=0.6, noise_hi=7000, refl=0.62, muffler_fc=2400,
             rasp=0.22, mech=0.03, drive=2.6, pop_min_rpm=1800, pop_rate=0.12, pop_gain=0.8),
    ),
    # bicylindre calé à 270° : gros battement irrégulier
    "moto-ville": (
        [(1.2, 1150, 0.06), (0.22, 4800, 1), (0.6, 1200, 0.02), (2.0, 8800, 1), (1.1, 1500, 0.0), (0.6, 1150, 0.06)],
        [([0, 270], 0.95)],
        dict(BASE, tau=1.1, rare=3.8, misfire=0.05, amp_jitter=0.12, noise=0.3, noise_hi=5000, refl=0.62, muffler_fc=950,
             rasp=0.08, mech=0.025, drive=1.8),
    ),
    # 4 cylindres en ligne type MotoGP : aigu, monte à 14 500 tr/min, pétarades
    "moto-circuit": (
        [(1.0, 1400, 0.08), (0.18, 7500, 1), (0.45, 1600, 0.0), (2.2, 14500, 1), (0.15, 14300, 1), (1.3, 2000, 0.0), (0.5, 1400, 0.08)],
        [([0, 180, 360, 540], 0.62)],
        dict(BASE, tau=0.35, rare=1.2, misfire=0.06, amp_jitter=0.1, noise=0.55, noise_hi=9000, refl=0.6, muffler_fc=3800,
             rasp=0.3, mech=0.05, drive=2.2, pop_min_rpm=4000, pop_rate=0.09, pop_gain=0.6),
    ),
}


def write_wav(path, y):
    data = (np.clip(y, -1, 1) * 32767).astype("<i2").tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out.mkdir(parents=True, exist_ok=True)
    for i, (name, (points, banks, params)) in enumerate(SOUNDS.items()):
        rpm, thr = profile(points)
        write_wav(out / f"{name}.wav", engine(rpm, thr, banks, params, seed=7 + i))
        print(name, f"{len(rpm) / SR:.1f} s")
