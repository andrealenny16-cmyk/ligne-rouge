---
name: ligne-rouge-design-system
description: Charte visuelle LIGNE ROUGE (atelier racing la nuit + rigueur catalogue Akrapovič : sombre, vitesse, performance). À charger avant de créer ou modifier toute page ou composant UI du site.
---

# LIGNE ROUGE — Design system

Ambiance : **atelier racing premium, la nuit**, croisée avec la rigueur des catalogues d'échappements de course
(grandes photos plein cadre étalonnées sombres, titres en capitales, un bouton blanc net avec flèche).
Mots-clés : vitesse, performance, **lumière**. Structure : hero, bandeaux photo et pied de page sombres et
cinématographiques ; tout le contenu (sélecteur, catalogue, fiches, panier, compte, admin) sur fond clair chaud
`bg-sand` (`#F4F2EE`) avec cartes blanches. **Uniquement de vraies photos et de vrais sons** (aucun visuel dessiné).

## Tokens (`src/app/globals.css`, `@theme`)

| Token Tailwind | Valeur | Usage |
|---|---|---|
| `bg-sand` | `#F4F2EE` | fond du contenu (body) |
| `bg-night` / `bg-night-2` | `#0A0A0B` / `#121214` | hero, bandeaux, footer, boutons sombres |
| `text-bronze` / `bg-bronze` | `#E8A36B` | accent : nav active, pastille « + », prix |
| `bg-heat` / `.text-heat` | `#3B82F6 → #8B5CF6 → #C08457` | dégradé « titane chauffé » : CTA d'achat, jauges, mots-clés de titres |
| `text-rouge` / `bg-rouge` | `#D7192E` | marque, badge circuit, filet des points forts |
| `text-alert` | `#E11D2E` | promos, erreurs |
| `.photo` (`bg-paper`) | `#0D0D0F` | fond de toutes les photos produit |
| `.glass` | carte blanche, filet `black/8`, ombre douce | cartes, panneaux du contenu clair |
| `.carbon` | tissage CSS | fonds de section, footer |
| `.speed-lines` | traînées horizontales | décor de vitesse derrière les tuiles et bandeaux |

## Structure du site : une seule page qui défile
`src/app/page.tsx` : `#accueil` (hero) → `#trouver` (recherche véhicule) → `#voiture` (univers Voiture : bandeau photo,
sons « En ville » / « Sur circuit », 3 pots) → `#moto` (idem) → `#piste` → `#conseil` (IA intégrée) → `#avis` → réassurance.
Le menu (`HeaderNav`) ne contient que ces ancres + compte/panier ; la section visible est surlignée (IntersectionObserver).
Toute nouvelle section se place dans ce flux avec un `id` et `scroll-mt-24`. Voiture et moto ne sont **jamais mélangées** :
fiche produit = bandeau « Échappement Voiture/Moto » + « Les autres pots Voiture/Moto » ; boutique groupée par univers.

## Typographie
- Titres : `font-display` (Anton), capitales, **italique** pour les titres de section et de fiche (effet vitesse),
  `leading-[0.85–0.9]`.
- Texte : Inter. Nav : Manrope. Références et micro-libellés : `font-mono` en capitales espacées.

## Composants
- **Hero d'accueil** (`src/components/hero/`) : vraie photo de circuit en fond (route / circuit en fondu), pot 3D
  photoréaliste au centre qui suit le curseur (HDRI de studio `public/hdri/studio.hdr`, titane brossé anisotrope,
  carbone verni, soudures, plaque de marque ; un vrai modèle `public/models/exhaust.glb` le remplace s'il existe),
  quincaillerie repoussée par la souris, **vis/écrous/boulons éjectés par les sorties du pot** (`hero/emitter.ts`, gerbe
  au clic sur le son et au changement de gamme), braises et fumée, bascule chorégraphiée (GSAP). **À conserver.**
- `SoundButton` (`usage`, `vehicle`, `label`) : joue `public/sounds/{voiture|moto}-{circuit|ville}.wav` (route = ville).
- `PillLink` / `PillButton` : pilule noire + pastille bronze « + » ; `variant="heat"` pour l'achat.
- **Bouton catalogue** (style course) : rectangle blanc ou contour blanc, `text-xs uppercase tracking-[0.2em]`,
  flèche `→` — pour « Trouver mon système », « Gamme circuit ».
- `ProductCard` : fiche visuelle sombre plein cadre — « Ligne Rouge · Échappement voiture », nom, modèles
  compatibles, points forts (filet rouge), bandeau bas catégorie · dB · Ø · matériau ; prix et badge dessous.
- `Photo` (`src/components/Photo.tsx`) : vraie photo de `public/photos/` (rien si absente). Sur les fiches, **le pot est le sujet** de la photo.
- `UsageBadge`, `CircuitWarning` (texte légal exact), `Gauge` (barre `bg-heat`).

## Photos
Vraies photos libres de droits (Unsplash) dans `public/photos/`, crédits dans `public/photos/CREDITS.md`.
Jamais de visuel dessiné ou généré.

## Checklist nouvelle page
1. Fond clair hérité du body, contenu dans `Page` ; sections sombres seulement pour les bandeaux photo.
2. Titre `PageTitle` (italique), au plus un mot en accent.
3. Cartes `.glass rounded-[28px]` ; photos dans `.photo`.
4. Mobile 375 px sans scroll horizontal ; animations coupées avec `prefers-reduced-motion`.
5. Badges route/circuit partout où un produit apparaît.
