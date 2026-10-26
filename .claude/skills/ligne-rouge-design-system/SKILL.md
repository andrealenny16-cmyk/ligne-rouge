---
name: ligne-rouge-design-system
description: Charte visuelle LIGNE ROUGE (boutique claire et sobre, photos réelles, rouge de marque). À charger avant de créer ou modifier toute page ou composant UI du site.
---

# LIGNE ROUGE — Design system

Le site doit **vendre** et ressembler à la boutique d'un vrai fabricant : fond clair, photos produit réelles,
typographie nette, un seul accent rouge. **Pas d'animation décorative, pas de 3D, pas d'effet verre ni de dégradé.**

## Tokens (définis dans `src/app/globals.css` via `@theme`)

| Token Tailwind | Valeur | Usage |
|---|---|---|
| `bg-white` / `text-ink` | `#FFFFFF` / `#111111` | fond et texte |
| `text-mute` | `#6B6B6B` | textes secondaires |
| `border-line` | `#E5E3DF` | filets, bordures de cartes |
| `bg-paper` (`.photo`) | `#EDEBE7` | fond de toutes les photos produit (même gris que les prompts studio) |
| `bg-cream` | `#F7F6F3` | sections et encarts discrets |
| `bg-rouge` / `text-rouge` | `#C8102E` | CTA principal, prix promo, badge circuit, état actif |
| `text-legal` | `#15803D` | badge homologué |

Ne jamais coder une couleur en dur dans un composant : passer par ces tokens.

## Typographie
- Titres : `font-display font-semibold uppercase` (Barlow Condensed), `leading-[0.95]`.
- Texte et interface : Inter (`font-sans`). Labels de formulaire : classe `.label`.
- Pas de police monospace.

## Photos
- Toujours via `src/components/Photo.tsx` : `<Photo src="/photos/…jpg" />` bascule sur le visuel provisoire de
  `public/products/` si la photo n'existe pas encore, ou ne rend rien avec `fallback={null}`.
- Fichiers attendus, formats et prompts : `docs/prompts-photos.md`. Produit = 3 vues (`-34`, `-profil`, `-monte`).
- Conteneurs photo : `photo relative aspect-[4/3] overflow-hidden rounded-md` + `object-cover`.

## Composants (`src/components/ui.tsx`)
- `PillLink` / `PillButton` : boutons rectangulaires `rounded-md`, majuscules. `variant="heat"` = rouge (action
  principale, une seule par écran), `dark` = noir, `outline` = contour.
- `UsageBadge` : « Homologué route » (contour vert) ou « Circuit uniquement » (rouge plein). Sur chaque carte et fiche.
- `CircuitWarning` : texte légal exact, obligatoire sur fiche produit circuit et au panier.
- `Gauge` : barre fine noire sur gris, valeur à droite. dB, ch, Nm, kg.
- `ProductCard` : photo 3/4, la vue de profil apparaît au survol (fondu simple), catégorie · matériau, nom, specs, prix.

## Mouvement
- Autorisé : changements de couleur au survol, fondu d'image, zoom très léger (≤ 3 %) sur les grandes tuiles.
- Interdit : particules, objets qui flottent, rotations, parallaxe, animations en boucle.

## Checklist nouvelle page
1. Contenu dans `Page` (`max-w-7xl`, marges latérales 16 px mobile).
2. Titre `PageTitle` ; au plus un mot en rouge.
3. Cartes : `bg-white border border-line rounded-md` (ou classe `.glass`, équivalente).
4. Mobile d'abord : tester à 375 px, aucun scroll horizontal.
5. Badges route/circuit partout où un produit apparaît.
