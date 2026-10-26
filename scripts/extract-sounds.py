"""Extrait les 4 sons du site à partir des enregistrements sources (bibliothèque standard uniquement).

Pour chaque source PCM 16 bits : trouve la fenêtre de N secondes la plus énergique dans les médiums/aigus
(un passe-haut simple écarte le souffle du vent) en excluant tout passage où le micro a saturé, applique une
compression dynamique douce, normalise à -1 dBFS, ajoute des fondus, écrit un WAV stéréo 16 bits non compressé
(format de fichier sans perte) dans public/sounds/.

Usage : python3 scripts/extract-sounds.py <dossier_sources>
Sources attendues (converties avec `afconvert -f WAVE -d LEI16@48000`) : pcm-nurburgring.wav, pcm-m3.wav,
pcm-moto-circuit.wav, pcm-moto-ville.wav. Voir public/sounds/CREDITS.md.
"""

import array
import io
import math
import sys
import wave
from pathlib import Path

# (source, fichier du site, durée en s, ratio de compression (1 = aucune), critère de choix du passage)
#   "aigus" : énergie après passe-haut (écarte le souffle du vent) ; "niveau" : énergie totale ET régulière
JOBS = [
    ("pcm-nurburgring.wav", "voiture-circuit.wav", 8.0, 4.0, "niveau"),
    ("pcm-m3.wav", "voiture-ville.wav", 8.0, 2.0, "aigus"),
    ("pcm-moto-circuit.wav", "moto-circuit.wav", 8.0, 1.6, "aigus"),
    ("pcm-moto-ville.wav", "moto-ville.wav", 8.0, 2.0, "aigus"),
]
CLIP = 32000  # un échantillon à ce niveau dans la source = micro saturé


def pcm_header(raw: bytes) -> bytes:
    """afconvert écrit WAVE_FORMAT_EXTENSIBLE (0xFFFE) : on le ramène à PCM simple (1) pour le module wave."""
    i = raw.find(b"fmt ")
    if i >= 0 and raw[i + 8 : i + 10] == b"\xfe\xff":
        raw = raw[: i + 8] + b"\x01\x00" + raw[i + 10 :]
    return raw


def read(path: Path):
    with wave.open(io.BytesIO(pcm_header(path.read_bytes()))) as w:
        assert w.getsampwidth() == 2, "PCM 16 bits attendu"
        ch, rate, n = w.getnchannels(), w.getframerate(), w.getnframes()
        data = array.array("h", w.readframes(n))
    if sys.byteorder == "big":
        data.byteswap()
    left = data[0::ch]
    right = data[1::ch] if ch > 1 else data[0::ch]
    return rate, left, right


def best_window(left, right, rate, seconds, mode="aigus"):
    """Début de la fenêtre la plus énergique ne contenant aucun échantillon saturé.
    En mode « niveau », chaque bloc compte en log : on privilégie un passage fort du début à la fin."""
    block = rate // 10  # blocs de 100 ms
    energies, clipped = [], []
    for start in range(0, len(left) - block, block):
        acc = 0
        prev = left[start] + right[start]
        for i in range(start + 1, start + block, 4):
            cur = left[i] + right[i]
            d = cur if mode == "niveau" else cur - prev
            acc += d * d
            prev = cur
        energies.append(math.log10(acc + 1) if mode == "niveau" else acc)
        seg_l, seg_r = left[start : start + block], right[start : start + block]
        clipped.append(max(max(seg_l), -min(seg_l), max(seg_r), -min(seg_r)) >= CLIP)
    win = int(seconds * 10)
    if len(energies) <= win:
        return 0
    best, best_i = -1, 0
    total = sum(energies[:win])
    bad = sum(clipped[:win])
    for k in range(win, len(energies) + 1):
        i = k - win
        if bad == 0 and total > best:
            best, best_i = total, i
        if k < len(energies):
            total += energies[k] - energies[i]
            bad += clipped[k] - clipped[i]
    return best_i * block


def compress(l, r, rate, ratio, threshold_db=-22.0):
    """Compresseur à enveloppe (attaque 5 ms, relâche 150 ms) : plus de corps sans écraser les attaques."""
    if ratio <= 1:
        return l, r
    att = math.exp(-1 / (0.005 * rate))
    rel = math.exp(-1 / (0.150 * rate))
    thr = 10 ** (threshold_db / 20)
    env = 0.0
    out_l, out_r = [0.0] * len(l), [0.0] * len(r)
    for i in range(len(l)):
        x = max(abs(l[i]), abs(r[i]))
        env = att * env + (1 - att) * x if x > env else rel * env + (1 - rel) * x
        g = 1.0
        if env > thr:
            g = (thr * (env / thr) ** (1 / ratio)) / env
        out_l[i] = l[i] * g
        out_r[i] = r[i] * g
    return out_l, out_r


def render(left, right, rate, start, seconds, ratio):
    n = min(int(seconds * rate), len(left) - start)
    l = [x / 32768 for x in left[start : start + n]]
    r = [x / 32768 for x in right[start : start + n]]
    peak = max(max(map(abs, l)), max(map(abs, r))) or 1
    l = [x / peak for x in l]
    r = [x / peak for x in r]
    l, r = compress(l, r, rate, ratio)
    peak = max(max(map(abs, l)), max(map(abs, r))) or 1
    gain = 10 ** (-1 / 20) / peak  # crête finale à -1 dBFS
    fade_in, fade_out = int(0.03 * rate), int(0.7 * rate)
    out = array.array("h", bytes(4 * n))
    for i in range(n):
        g = gain
        if i < fade_in:
            g *= i / fade_in
        elif i > n - fade_out:
            g *= max(0.0, (n - i) / fade_out) ** 1.5
        out[2 * i] = max(-32768, min(32767, int(l[i] * g * 32767)))
        out[2 * i + 1] = max(-32768, min(32767, int(r[i] * g * 32767)))
    return out, gain


def main():
    src = Path(sys.argv[1])
    dest = Path(__file__).resolve().parent.parent / "public" / "sounds"
    dest.mkdir(parents=True, exist_ok=True)
    for name, target, seconds, ratio, mode in JOBS:
        rate, left, right = read(src / name)
        start = best_window(left, right, rate, seconds, mode)
        out, gain = render(left, right, rate, start, seconds, ratio)
        if sys.byteorder == "big":
            out.byteswap()
        with wave.open(str(dest / target), "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(out.tobytes())
        print(f"{target}: extrait {start / rate:.1f}s → {start / rate + seconds:.1f}s, compression {ratio}:1")


if __name__ == "__main__":
    main()
