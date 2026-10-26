---
name: ligne-rouge-design-system
description: Charte visuelle LIGNE ROUGE (atelier racing la nuit + rigueur catalogue Akrapovič : sombre, vitesse, performance). À charger avant de créer ou modifier toute page ou composant UI du site.
---

# LIGNE ROUGE — Design system

Ambiance : **atelier racing premium, la nuit**, croisée avec la rigueur des catalogues d'échappements de course
(grandes photos plein cadre étalonnées sombres, titres en capitales, un bouton blanc net avec flèche).
Mots-clés : sombre, vitesse, performance.

## Tokens (`src/app/globals.css`, `@theme`)

| Token Tailwind | Valeur | Usage |
|---|---|---|
| `bg-night` / `bg-night-2` | `#0A0A0B` / `#121214` | fonds |
| `text-bronze` / `bg-bronze` | `#E8A36B` | accent : nav active, pastille « + », prix |
| `bg-heat` / `.text-heat` | `#3B82F6 → #8B5CF6 → #C08457` | dégradé « titane chauffé » : CTA d'achat, jauges, mots-clés de titres |
| `text-rouge` / `bg-rouge` | `#D7192E` | marque, badge circuit, filet des points forts |
| `text-alert` | `#E11D2E` | promos, erreurs |
| `.photo` (`bg-paper`) | `#0D0D0F` | fond de toutes les photos produit |
| `.glass` | verre dépoli `white/5` + bordure `white/10` | cartes, panneaux |
| `.carbon` | tissage CSS | fonds de section, footer |
| `.speed-lines` | traînées horizontales | décor de vitesse derrière les tuiles et bandeaux |

## Typographie
- Titres : `font-display` (Anton), capitales, **italique** pour les titres de section et de fiche (effet vitesse),
  `leading-[0.85–0.9]`.
- Texte : Inter. Nav : Manrope. Références et micro-libellés : `font-mono` en capitales espacées.

## Composants
- **Hero d'accueil** (`src/components/hero/`) : pot 3D Three.js au centre qui suit le curseur, quincaillerie
  repoussée par la souris, braises et fumée, bascule route/circuit chorégraphiée (GSAP), bouton « Écouter »
  (`src/lib/sound.ts`, Web Audio). **À conserver tel quel.**
- `PillLink` / `PillButton` : pilule noire + pastille bronze « + » ; `variant="heat"` pour l'achat.
- **Bouton catalogue** (style course) : rectangle blanc ou contour blanc, `text-xs uppercase tracking-[0.2em]`,
  flèche `→` — pour « Trouver mon système », « Gamme circuit ».
- `ProductCard` : fiche visuelle sombre plein cadre — « Ligne Rouge · Échappement voiture », nom, modèles
  compatibles, points forts (filet rouge), bandeau bas catégorie · dB · Ø · matériau ; prix et badge dessous.
- `Photo` (`src/components/Photo.tsx`) : vraie photo de `public/photos/` ou visuel provisoire de repli.
- `UsageBadge`, `CircuitWarning` (texte légal exact), `Gauge` (barre `bg-heat`).

## Photos
Direction et prompts : `docs/prompts-photos.md` (pot au premier plan, véhicule derrière, néon de couleur par
produit). Jamais de logo de constructeur ni de texte dans l'image.

## Checklist nouvelle page
1. Fond `bg-night`, contenu dans `Page`.
2. Titre `PageTitle` (italique), au plus un mot en accent.
3. Cartes `.glass rounded-[28px]` ; photos dans `.photo`.
4. Mobile 375 px sans scroll horizontal ; animations coupées avec `prefers-reduced-motion`.
5. Badges route/circuit partout où un produit apparaît.
