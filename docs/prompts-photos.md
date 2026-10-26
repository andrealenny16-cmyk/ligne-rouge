# Prompts photo — LIGNE ROUGE

Objectif : des photos qui ressemblent à celles d'un vrai fabricant d'échappements. Une gamme cohérente : même fond,
même lumière, mêmes angles pour tous les produits.

Les prompts sont en anglais : les générateurs d'images (Midjourney, ChatGPT Image, Firefly, Ideogram) donnent de
meilleurs résultats ainsi. Les notes sont en français.

## Comment s'en servir

1. Colle le **bloc de style commun** à la fin de chaque prompt produit.
2. Génère 4 variantes, garde la meilleure, et vérifie : forme cohérente avec la fiche (nombre de sorties, matière), aucun logo
   de marque existante, pas de texte parasite.
3. **La plaque de marque** : demande une plaque ovale rivetée **vierge**, puis incruste notre logo
   `public/brand/ligne-rouge-plaque.svg` (ou `-noir.svg`) en retouche (Photoshop, Photopea gratuit, Canva). Légère perspective,
   opacité 90 %, mode « Produit » ou « Lumière tamisée » pour qu'elle prenne la lumière. ChatGPT Image écrit souvent
   correctement « LIGNE ROUGE » : tu peux aussi l'essayer directement.
4. Exporte en **JPG qualité 85, 2000 × 1500 px** (4:3), sauf mention contraire, et dépose les fichiers dans `public/photos/` avec
   les noms indiqués. Je branche ensuite le site dessus.

Paramètres Midjourney conseillés : `--ar 4:3 --style raw --v 7` (`--ar 16:9` pour le hero et les ambiances).

## Bloc de style commun (photos produit studio)

```
professional e-commerce product photography, isolated on a seamless light warm grey background (#EDEBE7),
soft large softbox key light from top left, subtle rim light, gentle realistic contact shadow under the product,
85mm lens, f/11, ultra sharp focus across the whole product, true-to-life metal reflections, brushed titanium texture,
visible TIG weld beads, realistic heat discoloration (gold to blue to purple) only near the welds,
photorealistic, 8k, catalog shot for a premium French exhaust manufacturer,
a small blank oval riveted brushed titanium badge plate on the side of the silencer,
no brand logos, no text, no watermark, no people
```

## Bloc de style commun (photos montées et ambiances)

```
editorial automotive photography, natural realistic lighting, shallow depth of field, 35mm lens,
photorealistic, high dynamic range, subtle film grain, no visible car or motorcycle brand logos or badges,
no license plate text, no watermark
```

---

## 1. TITAN GT · `LR-GT-01` · voiture · route

Ligne cat-back titane grade 2, 4 sorties Ø 102 mm à embouts carbone, silencieux ovale.

**`titan-gt-34.jpg`** — vue 3/4 avant
```
a complete cat-back car exhaust system made of raw brushed titanium, oval rear silencer,
four round 102mm tailpipes arranged in two pairs with carbon fiber outer sleeves and polished titanium inner lips,
mandrel-bent titanium pipes with V-band clamps, three-quarter front view slightly from above, the whole system visible
```
**`titan-gt-profil.jpg`** — profil
```
same titanium cat-back exhaust system, pure side profile view at eye level, oval silencer centered,
twin pairs of carbon fiber tips on the right, inlet pipe and flange on the left, perfectly horizontal
```
**`titan-gt-monte.jpg`** — monté (bloc ambiance)
```
low rear three-quarter close-up of a modern white compact hot hatchback, four round carbon fiber exhaust tips
with titanium lips exiting under a black rear diffuser, wet asphalt, evening city lights bokeh
```

## 2. CARBON FURY · `LR-CF-02` · voiture · route

Silencieux arrière inox noir mat, valve pilotée, double sortie carbone.

**`carbon-fury-34.jpg`**
```
a rear car exhaust silencer in matte black ceramic coated stainless steel, oval body,
a compact electronic exhaust valve actuator with its connector mounted on the inlet pipe,
two large round carbon fiber tips with stainless inner lips, three-quarter front view slightly from above
```
**`carbon-fury-profil.jpg`**
```
same matte black valved rear silencer, pure side profile view at eye level, valve actuator visible on top of the inlet,
twin carbon tips on the right, perfectly horizontal
```
**`carbon-fury-monte.jpg`**
```
rear close-up of a dark grey two-door German sports coupe, twin large carbon fiber exhaust tips under the bumper,
slight heat haze from the tips, underground parking garage with cold neon lighting
```

## 3. INFERNO R · `LR-IR-03` · voiture · circuit

Ligne complète décatalysée titane, 4 sorties Ø 115 mm « bleu chauffe ».

**`inferno-r-34.jpg`**
```
a full race car exhaust system without catalytic converter, entirely titanium, heavily heat-colored "burnt blue"
finish with gold, violet and deep blue gradients across the pipes, short straight-through silencer,
four large 115mm round tailpipes in burnt blue titanium, race V-band clamps and springs,
three-quarter front view slightly from above
```
**`inferno-r-profil.jpg`**
```
same burnt blue titanium race exhaust system, pure side profile at eye level, quad tips on the right,
long front pipe with flex section on the left, perfectly horizontal
```
**`inferno-r-monte.jpg`**
```
low rear shot of a matte black compact performance hatchback in a race track pit lane, four burnt blue titanium
exhaust tips glowing slightly at the edges, blue flames visible inside the tips, dusk, track lights
```

## 4. SPECTRE S · `LR-SS-04` · moto · route

Slip-on titane noir (traitement DLC), corps hexagonal, double embout carbone, raccord titane.

**`spectre-s-34.jpg`**
```
a motorcycle slip-on exhaust silencer with a hexagonal cross-section body in black titanium (DLC coated, satin black),
a carbon fiber end cap with two small round outlets, a titanium link pipe with a spring clamp,
carbon fiber mounting strap, three-quarter view slightly from above
```
**`spectre-s-profil.jpg`**
```
same black hexagonal titanium motorcycle slip-on, pure side profile, link pipe on the left angled slightly upward,
carbon end cap on the right
```
**`spectre-s-monte.jpg`**
```
close-up of the right rear side of a large adventure touring motorcycle with a boxer engine, black hexagonal
slip-on exhaust with carbon end cap, gravel mountain road, golden hour, dust in the air
```

## 5. VIPER TWIN · `LR-VT-05` · moto · route

Double silencieux sous-selle inox, embouts carbone.

**`viper-twin-34.jpg`**
```
a pair of motorcycle under-seat exhaust silencers in polished stainless steel, stacked twin cylindrical canisters
joined by a stainless bracket, short carbon fiber end caps, Y-shaped stainless link pipe,
three-quarter rear view slightly from above
```
**`viper-twin-profil.jpg`**
```
same twin under-seat stainless silencers, pure side profile, canisters angled upward toward the rear,
link pipe on the left
```
**`viper-twin-monte.jpg`**
```
rear three-quarter shot of a modern naked roadster motorcycle with a three-cylinder engine, twin stainless
under-seat exhausts with carbon caps exiting beneath the tail, wet city street at night, red tail light glow
```

## 6. HELLCAT RACING · `LR-HR-06` · moto · circuit

Ligne complète titane 4-en-1 avec collecteurs, silencieux court type MotoGP.

**`hellcat-racing-34.jpg`**
```
a full 4-into-1 titanium motorcycle racing exhaust system: four header pipes with rainbow heat discoloration
(gold, blue, purple) merging into one collector, a short stubby MotoGP-style titanium silencer with a carbon end cap,
safety-wired springs, three-quarter view slightly from above, the whole system visible
```
**`hellcat-racing-profil.jpg`**
```
same 4-into-1 titanium racing exhaust, pure side profile, header pipes curving down on the left,
short silencer on the right, perfectly horizontal
```
**`hellcat-racing-monte.jpg`**
```
superbike racing motorcycle on a paddock stand in a race track garage, short titanium MotoGP-style exhaust with
heat-colored headers visible under the fairing, mechanics' tools blurred in background, bright pit garage lighting
```

---

## Images du site

**`hero-route.jpg`** — 2400 × 1350 (16:9), haut de la page d'accueil, gamme route
```
dramatic dark studio product shot of a premium raw brushed titanium car exhaust silencer with four carbon fiber tips,
floating at a slight diagonal angle, deep navy blue to black background, single hard spotlight from above,
sharp reflections, thin wisps of smoke near the tips, generous empty space on the left for text,
photorealistic, 8k, no text, no logos
```
**`hero-circuit.jpg`** — même cadrage, gamme circuit
```
same composition, burnt blue heat-colored titanium race exhaust with four large tips, deep ember red to black background,
small glowing sparks and embers drifting near the tips, generous empty space on the left for text,
photorealistic, 8k, no text, no logos
```
**`categorie-voitures.jpg`** — 1600 × 1200
```
rear view of a modern performance car at night on an empty road, glowing red tail lights, exhaust tips in focus,
cinematic, moody, no brand logos
```
**`categorie-motos.jpg`** — 1600 × 1200
```
superbike leaning into a corner on a race track, low angle, exhaust side visible, motion blur on the background,
no brand logos, no rider identity visible
```
**`ambiance-atelier.jpg`** — 2400 × 1350, section savoir-faire
```
close-up of a welder TIG welding a titanium exhaust pipe in a clean workshop, blue arc light, gloved hands,
titanium pipes on the bench, sparks, shallow depth of field
```
**`ambiance-circuit.jpg`** — 2400 × 1350, section circuit
```
race track pit lane at dusk, cars lined up, heat haze, track lights turning on, wide cinematic shot, no logos
```

## Récapitulatif des fichiers attendus dans `public/photos/`

| Fichier | Format | Usage |
|---|---|---|
| `<slug>-34.jpg` × 6 | 2000 × 1500 | Image principale : cartes boutique, fiche produit, panier |
| `<slug>-profil.jpg` × 6 | 2000 × 1500 | 2ᵉ vue de la galerie produit |
| `<slug>-monte.jpg` × 6 | 2000 × 1500 | 3ᵉ vue de la galerie : produit monté |
| `hero-route.jpg`, `hero-circuit.jpg` | 2400 × 1350 | Hero de l'accueil |
| `categorie-voitures.jpg`, `categorie-motos.jpg` | 1600 × 1200 | Entrées Voitures / Motos |
| `ambiance-atelier.jpg`, `ambiance-circuit.jpg` | 2400 × 1350 | Sections éditoriales |

Slugs : `titan-gt`, `carbon-fury`, `inferno-r`, `spectre-s`, `viper-twin`, `hellcat-racing`.
