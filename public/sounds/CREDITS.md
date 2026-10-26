# Sons d'échappement — LIGNE ROUGE

Quatre vrais enregistrements, en WAV 48 kHz 16 bits stéréo non compressés (aucune perte de qualité), 8 s chacun.
Lus par `src/lib/sound.ts` selon le produit : véhicule (voiture / moto) et gamme (circuit / route = ville).

Extraits avec `scripts/extract-sounds.py` : choix automatique du passage le plus puissant **sans aucune saturation
du micro**, compression dynamique douce, normalisation à -1 dBFS, fondus d'entrée et de sortie.

| Fichier | Source | Enregistrement | Licence |
|---|---|---|---|
| `voiture-circuit.wav` | Internet Archive / radio aporee (`aporee_58983_67686`) | Voitures de course au Nürburgring (NLS 2021), Zoom H2N + 2× Rode VideoMicro ORTF, FLAC | Domaine public (Public Domain Mark 1.0) |
| `voiture-ville.wav` | Internet Archive (`2008-bmw-m3-e92-s65-exhaust-sound-recordings`) | BMW M3 E92 V8 S65, échappement enregistré pendant un trajet réel (DJI Mic, 24 bits), FLAC | CC BY 4.0 — auteur indiqué sur la page Archive |
| `moto-circuit.wav` | Mixkit (sfx 2723, WAV) | « Racing motorcycle engine speeding up » | Mixkit Sound Effects Free License |
| `moto-ville.wav` | Mixkit (sfx 2728, WAV) | « Sports bike engine » | Mixkit Sound Effects Free License |

Si un fichier manque, le site joue un son synthétisé (Web Audio) en secours.
