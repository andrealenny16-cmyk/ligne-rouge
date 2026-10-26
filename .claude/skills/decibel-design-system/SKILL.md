---
name: decibel-design-system
description: Charte visuelle DÉCIBEL Performance (couleurs, typos, composants, animations). À charger avant de créer ou modifier toute page ou composant UI du site.
---

# DÉCIBEL — Design system

Ambiance : **atelier racing premium, la nuit**. Sombre, technique, métallique, avec du verre dépoli.

## Tokens (déjà définis dans `src/app/globals.css` via `@theme`)

| Token Tailwind | Valeur | Usage |
|---|---|---|
| `bg-night` | `#0A0A0B` | fond global |
| `text-bronze` / `bg-bronze` | `#E8A36B` | accent principal : nav active, pastille « + », carte active, prix |
| `text-alert` / `bg-alert` | `#E11D2E` | badge Circuit, promos, erreurs |
| `text-legal` | `#22C55E` | badge Homologué |
| `.bg-heat` | `linear-gradient(90deg,#3B82F6,#8B5CF6,#C08457)` | dégradé « titane chauffé » : CTA, soulignements, jauges |
| `.glass` | `rgba(255,255,255,.05)` + bordure `rgba(255,255,255,.1)` + `backdrop-blur` | toutes les cartes |
| `.carbon` | `repeating-linear-gradient` tissé | fonds de sections, embouts |

Ne jamais introduire une nouvelle couleur en dur : passer par ces tokens.

## Typographie
- Titres : `font-display` (Anton), **toujours en capitales**, `leading-[0.85]`, tracking léger.
- Texte : `font-sans` (Inter). Nav : `font-nav` (Manrope).
- Références produit : `font-mono text-xs text-white/50` → `REF. DB-GT-01`.

## Composants (dans `src/components/`)
- `PillButton` : pilule noire semi-transparente `bg-black/50` + pastille bronze « + » à droite. Variante `heat` pour le CTA principal.
- `UsageBadge` : `route` → vert « Homologué », `circuit` → rouge « Circuit ». Toujours afficher sur cartes et fiches.
- `CircuitWarning` : texte légal exact *« Usage exclusif sur circuit fermé. Non homologué pour la circulation sur voie publique. »* — obligatoire sur fiche produit circuit et au panier.
- `Gauge` : barre fine, fond `white/10`, remplissage `.bg-heat`, libellé + valeur en mono. Utilisée pour dB, ch, kg.
- `ProductCard` : `.glass .sheen` (reflet qui balaie au survol), vignette qui se soulève et pivote (`group-hover:-translate-y-3 group-hover:-rotate-6`), badge, ref mono, prix bronze, prix barré si promo.
- Séparateurs : `.cote` = ligne fine avec tirets aux extrémités, façon cote technique.

## Animations
- Micro-interactions : `transition duration-300`, easing `cubic-bezier(0.175,0.885,0.32,1.275)` pour les « pops ».
- Le hero (seul écran bloqué à 100vh) utilise GSAP + Three.js ; ailleurs, CSS uniquement.
- Respecter `prefers-reduced-motion` : couper les animations continues.

## Checklist nouvelle page
1. Fond `bg-night`, contenu dans `max-w-7xl mx-auto px-4 md:px-8`.
2. Titre de page en `font-display` uppercase, taille `text-5xl md:text-7xl`, avec un mot en bronze.
3. Cartes en `.glass rounded-3xl`.
4. Mobile d'abord : tester à 375 px, aucune barre de scroll horizontale.
5. Badges route/circuit partout où un produit apparaît.
