# Sons d'échappement — LIGNE ROUGE

Lus par `src/lib/sound.ts` selon le véhicule et l'usage du produit : `{voiture|moto}-{route|circuit}.mp3`.
Si un fichier manque, le site joue un son synthétisé en secours.

| Fichier | Source | Titre | Licence |
|---|---|---|---|
| `moto-route.mp3` | Mixkit (assets.mixkit.co, sfx 2728) | Sports bike engine | Mixkit Sound Effects Free License (usage commercial, sans attribution) |
| `moto-circuit.mp3` | Mixkit (assets.mixkit.co, sfx 2723) | Racing motorcycle engine speeding up | Mixkit Sound Effects Free License |
| Voiture (route et circuit) | Synthèse Web Audio (`playSynth` dans `src/lib/sound.ts`) | Démarrage + coup de gaz + pleine charge, pétarades en circuit | Création maison |

Pour passer les voitures en vrais enregistrements, déposer `voiture-route.mp3` et `voiture-circuit.mp3` ici :
aucune modification de code n'est nécessaire.
