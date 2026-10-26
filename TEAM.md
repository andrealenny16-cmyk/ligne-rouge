# Répartition du travail — LIGNE ROUGE

Projet réalisé en binôme. Chaque membre commite sur le dépôt partagé avec son propre compte Git
(petits commits réguliers, messages en français : `feat: …`, `fix: …`, `chore: …`).

## Membre A — Données & parcours client

- Base de données Supabase : `supabase/migrations/*`, RLS, `is_admin()`, `checkout()`, seed
- Authentification : `/inscription`, `/connexion`, `src/middleware.ts`, `src/lib/supabase/*`
- Panier persisté : `/panier`, `src/lib/cart.ts`, actions `addToCart` / `updateCartItem` / `removeCartItem`
- Commande : `/commande`, `/commande/confirmation/[id]`, action `placeOrder`
- Compte client : `/compte` (commandes, Mon garage, favoris, adresses)
- Script de démo : `supabase/seed_demo_orders.sql`

## Membre B — Interface, catalogue, admin & IA

- Design system : `src/app/globals.css`, `src/components/ui.tsx`, skill `ligne-rouge-design-system`
- Accueil une page `src/app/page.tsx`, hero 3D `src/components/hero/*` (Three.js + GSAP, éjection de quincaillerie), sélecteur véhicule
- Boutique et fiches produit : `/boutique`, `/produit/[slug]`, photos `docs/prompts-photos.md`, identité `scripts/gen-brand.mjs`
- Admin & KPIs : `/admin`, `/admin/commandes`, `/admin/produits`, vues `kpi_*`, skill `kpi-dashboard`
- Configurateur IA : `/configurateur`, `src/app/api/configurateur/route.ts`, `src/lib/recommend.ts`

## Règles communes

- Toute nouvelle page charge la skill `ligne-rouge-design-system`.
- Toute modification SQL passe par une nouvelle migration (skill `supabase-migrations`).
- `npm run build` doit passer avant chaque push.
