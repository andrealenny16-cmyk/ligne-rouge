# Prompts photo — LIGNE ROUGE

Direction artistique : **planche de référence « catalogue sombre »**. Chaque pot est le héros de l'image, posé au
premier plan sur un sol mouillé et sombre, avec **le véhicule compatible derrière lui dans la pénombre** (feux allumés).
Une **lumière néon de couleur propre à chaque produit** sculpte le métal. Carbone tissé brillant, titane brossé,
collecteurs bleuis par la chaleur, soudures TIG visibles. Rendu photo publicitaire, pas illustration.

Les prompts sont en anglais (meilleurs résultats avec Midjourney, ChatGPT Image, Firefly, Ideogram). Notes en français.

## Comment s'en servir

1. Colle le **bloc de style commun** à la fin de chaque prompt.
2. Génère 4 variantes, garde la meilleure. Vérifie : forme conforme à la fiche (nombre et diamètre des sorties, matières),
   **aucun logo de marque existante sur le pot ni sur le véhicule** (ni BMW, ni Ducati, ni Kawasaki…), pas de texte parasite.
   Le site affiche lui-même le nom, la compatibilité et les specs en surimpression : l'image doit rester propre.
3. **Le logo** : demande une petite plaque ovale rivetée vierge sur le silencieux, puis incruste
   `public/brand/ligne-rouge-plaque.svg` en retouche (Photoshop, Photopea gratuit, Canva). ChatGPT Image écrit souvent
   correctement « LIGNE ROUGE » : tu peux aussi l'essayer directement.
4. Exporte en **JPG qualité 85, 2000 × 1600 px** (5:4) sauf mention contraire, dans `public/photos/`, avec les noms indiqués.
   Le site les affiche automatiquement.

Paramètres Midjourney conseillés : `--ar 5:4 --style raw --v 7` (`--ar 16:9` pour le hero et les ambiances).

## Bloc de style commun

```
premium automotive advertising photography, dark moody garage studio, wet glossy black concrete floor with reflections,
the exhaust system is the hero in sharp focus in the foreground, the vehicle stands behind it slightly out of focus
in the shadows with its lights on, cinematic low key lighting with a colored neon accent light, light haze,
glossy carbon fiber weave, brushed titanium, heat-blued titanium pipes (gold, blue, purple) near the welds,
visible TIG weld beads, polished titanium tip lips, a small blank oval riveted brushed titanium badge plate on the silencer,
photorealistic, ultra detailed, 8k, 50mm lens, f/4,
no brand logos or badges on the vehicle or the exhaust, no license plate text, no text, no watermark, no people
```

Chaque produit a trois images :

| Suffixe | Contenu | Usage sur le site |
|---|---|---|
| `-34.jpg` | Le pot au premier plan, le véhicule derrière (comme la planche) | Carte boutique, image principale de la fiche |
| `-profil.jpg` | Le pot seul, de profil, sur fond noir avec la lumière de couleur | 2ᵉ vue de la galerie |
| `-monte.jpg` | Gros plan détail : embouts, soudures ou carbone, monté sur le véhicule | 3ᵉ vue de la galerie |

---

## 1. TITAN GT · `LR-GT-01` · voiture · route · lumière **blanc chaud**

Ligne cat-back titane grade 2, silencieux ovale, 4 sorties Ø 102 mm à embouts carbone.

**`titan-gt-34.jpg`**
```
a complete titanium cat-back exhaust system lying on the floor in the foreground: oval brushed titanium rear silencer,
four round 102mm tailpipes in two pairs with glossy carbon fiber sleeves and polished titanium lips,
mandrel-bent titanium pipes with V-band clamps; behind it the rear of a white modern compact hot hatchback
with red LED tail lights glowing, warm white key light and soft amber accent light
```
**`titan-gt-profil.jpg`**
```
the same titanium cat-back exhaust system alone, pure side profile, floating just above a black reflective floor,
pitch black background, warm white rim light outlining the silhouette, oval silencer centered, carbon tips on the right
```
**`titan-gt-monte.jpg`**
```
extreme close-up of four round carbon fiber exhaust tips with polished titanium lips exiting under a black rear diffuser
of a white hot hatchback, carbon weave in sharp detail, droplets of water, warm light
```

## 2. CARBON FURY · `LR-CF-02` · voiture · route · lumière **bleu électrique**

Silencieux arrière inox noir mat à valve pilotée, double sortie carbone Ø 100 mm.

**`carbon-fury-34.jpg`**
```
a rear exhaust silencer in matte black ceramic coated stainless steel lying in the foreground, compact electronic valve
actuator with its cable on the inlet pipe, two large round 100mm carbon fiber tips with titanium lips;
behind it the rear of a dark grey two-door German sports coupe with thin LED tail lights,
cold electric blue neon accent light from the left
```
**`carbon-fury-profil.jpg`**
```
the same matte black valved silencer alone, pure side profile, black background, electric blue rim light,
valve actuator visible on top of the inlet, twin carbon tips on the right
```
**`carbon-fury-monte.jpg`**
```
close-up of twin large carbon fiber exhaust tips under the rear bumper of a dark grey coupe, slight heat haze,
blue neon reflections on the carbon
```

## 3. INFERNO R · `LR-IR-03` · voiture · circuit · lumière **bleu profond + flammes**

Ligne complète décatalysée titane, finition « bleu chauffe », 4 sorties Ø 115 mm.

**`inferno-r-34.jpg`**
```
a full titanium race exhaust system without catalytic converter lying in the foreground, heavily heat-colored
burnt blue titanium with gold and violet gradients, short straight-through silencer with carbon end cap,
four huge 115mm round tips in burnt blue titanium, race springs on the joints; behind it the rear of a matte black
compact performance hatchback in a race track pit garage, deep blue neon light, small blue flames visible in the tips
```
**`inferno-r-profil.jpg`**
```
the same burnt blue titanium race exhaust system alone, pure side profile, black background, deep blue rim light,
quad tips on the right, front pipe with flex section on the left
```
**`inferno-r-monte.jpg`**
```
close-up of four burnt blue titanium exhaust tips under a carbon rear diffuser, glowing hot edges,
blue flame inside one tip, dark pit lane background
```

## 4. SPECTRE S · `LR-SS-04` · moto · route · lumière **bleu froid**

Slip-on titane noir DLC, corps hexagonal, embout carbone, raccord titane, sortie Ø 60 mm.

**`spectre-s-34.jpg`**
```
a motorcycle slip-on exhaust with a hexagonal cross-section body in satin black titanium (DLC coated)
lying in the foreground, carbon fiber end cap with a 60mm outlet, titanium link pipe with spring clamp,
carbon mounting strap; behind it a large black adventure touring motorcycle with a boxer engine and a tall windscreen,
cold blue neon strip lights in the background
```
**`spectre-s-profil.jpg`**
```
the same black hexagonal titanium slip-on alone, pure side profile, black background, cold blue rim light,
link pipe on the left angled upward, carbon end cap on the right
```
**`spectre-s-monte.jpg`**
```
close-up of a black hexagonal titanium slip-on with carbon end cap mounted on the right side of an adventure motorcycle,
dust on the bodywork, cold blue light
```

## 5. VIPER TWIN · `LR-VT-05` · moto · route · lumière **vert néon**

Double silencieux sous-selle inox poli, embouts carbone, sorties Ø 50 mm.

**`viper-twin-34.jpg`**
```
a pair of motorcycle under-seat exhaust silencers in polished stainless steel lying in the foreground,
stacked twin cylindrical canisters joined by a bracket, short carbon fiber end caps with 50mm outlets,
Y-shaped stainless link pipe; behind it a modern black naked roadster motorcycle with a three-cylinder engine,
vivid green neon accent light
```
**`viper-twin-profil.jpg`**
```
the same twin under-seat stainless silencers alone, pure side profile, black background, vivid green rim light,
canisters angled upward toward the rear
```
**`viper-twin-monte.jpg`**
```
close-up of twin stainless under-seat exhausts with carbon caps exiting beneath the tail of a naked motorcycle,
green neon reflections on the polished steel
```

## 6. HELLCAT RACING · `LR-HR-06` · moto · circuit · lumière **rouge**

Ligne complète titane 4-en-1 avec collecteurs, silencieux court type MotoGP, sortie Ø 60 mm.

**`hellcat-racing-34.jpg`**
```
a full 4-into-1 titanium motorcycle racing exhaust system lying in the foreground: four header pipes with rainbow
heat discoloration (gold, blue, purple) merging into one collector, a short stubby MotoGP-style titanium silencer
with an angular carbon fiber end cap, safety-wired springs; behind it a red superbike on a paddock stand in a race garage,
intense red neon light
```
**`hellcat-racing-profil.jpg`**
```
the same 4-into-1 titanium racing exhaust alone, pure side profile, black background, intense red rim light,
header pipes curving down on the left, short silencer on the right
```
**`hellcat-racing-monte.jpg`**
```
close-up of heat-colored titanium header pipes and the short carbon-capped silencer under the fairing of a red superbike,
TIG welds in sharp detail, red light
```

---

## Images du site

**`hero-route.jpg`** — 2400 × 1350 (16:9), haut de la page d'accueil
```
wide cinematic shot in a dark garage: in the foreground a brushed titanium exhaust system with four carbon fiber tips
on a wet black floor, behind it the rear of a dark performance car with glowing red tail lights, left half of the frame
dark and empty for text, red and warm white lighting, haze, photorealistic, no logos, no text
```
**`hero-circuit.jpg`** — même cadrage, gamme circuit
```
same composition with a burnt blue titanium race exhaust and a red superbike behind, intense red neon,
small sparks in the air, left half dark and empty for text, no logos, no text
```
**`categorie-voitures.jpg`** — 1600 × 1280 (5:4)
```
rear three-quarter view of a dark performance car in a dark garage, quad exhaust tips in focus, red tail lights,
wet floor reflections, cinematic, no logos
```
**`categorie-motos.jpg`** — 1600 × 1280 (5:4)
```
superbike on a paddock stand in a dark race garage, exhaust side visible, red and blue neon lights, no logos
```
**`ambiance-atelier.jpg`** — 2000 × 1500
```
close-up of a gloved welder TIG welding a titanium exhaust collector, blue arc light, heat-colored titanium,
dark workshop, sparks, shallow depth of field
```
**`ambiance-circuit.jpg`** — 2400 × 1350
```
race track pit lane at night, a car leaving with flames from the exhaust, track lights, long exposure, no logos
```

## Récapitulatif des fichiers attendus dans `public/photos/`

| Fichier | Format | Usage |
|---|---|---|
| `<slug>-34.jpg` × 6 | 2000 × 1600 | Carte boutique + image principale |
| `<slug>-profil.jpg` × 6 | 2000 × 1600 | Galerie produit |
| `<slug>-monte.jpg` × 6 | 2000 × 1600 | Galerie produit (détail) |
| `hero-route.jpg`, `hero-circuit.jpg` | 2400 × 1350 | Hero accueil |
| `categorie-voitures.jpg`, `categorie-motos.jpg` | 1600 × 1280 | Entrées Voiture / Moto |
| `ambiance-atelier.jpg`, `ambiance-circuit.jpg` | 2000 × 1500 / 2400 × 1350 | Sections éditoriales |

Slugs : `titan-gt`, `carbon-fury`, `inferno-r`, `spectre-s`, `viper-twin`, `hellcat-racing`.
