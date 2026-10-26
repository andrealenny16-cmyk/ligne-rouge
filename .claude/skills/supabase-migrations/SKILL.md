---
name: supabase-migrations
description: Conventions SQL et process Supabase pour LIGNE ROUGE (nommage, RLS systématique, fonctions security definer, vues KPI). À charger avant d'écrire ou modifier une migration ou une table.
---

# Migrations Supabase — conventions LIGNE ROUGE

## Fichiers
- Une migration = un fichier `supabase/migrations/NNN_nom_snake.sql` (NNN incrémental : `002_wishlist_alerts.sql`).
- Jamais modifier une migration déjà appliquée : en créer une nouvelle.
- Appliquer via le MCP Supabase `apply_migration` (nom = `nnn_nom_snake`) puis relancer `get_advisors` (security + performance) et corriger chaque alerte.

## Nommage
- Tables au pluriel snake_case (`cart_items`), clés `id uuid default gen_random_uuid()` sauf référentiels simples (`bigint generated always as identity`).
- FK : `<table_singulier>_id`, toujours avec `on delete` explicite (`cascade` pour les données possédées par l'utilisateur, `restrict` pour le catalogue référencé par des commandes).
- Énumérations : type `enum` Postgres (`usage_type`, `order_status`…) plutôt que `text` libre.
- Contraintes `check` pour les bornes métier (`rating between 1 and 5`, `quantity > 0`, `stock >= 0`).
- Index sur chaque FK et sur les colonnes filtrées (`products(vehicle_type, usage)`).

## RLS — systématique
Chaque `create table` est suivi **dans le même fichier** de :
```sql
alter table public.x enable row level security;
```
puis des policies selon le modèle :

| Type de donnée | select | insert/update/delete |
|---|---|---|
| Catalogue (products, variants, makes…) | `true` (public) | `public.is_admin()` |
| Données client (cart, garage, favoris, adresses) | `user_id = (select auth.uid()) or public.is_admin()` | `user_id = (select auth.uid())` |
| Commandes | propriétaire ou admin | insert uniquement via `checkout()` ; update admin |
| Logs (events, ai logs) | admin | insert ouvert (`user_id is null or = auth.uid()`) |

- Toujours écrire `(select auth.uid())` (évalué une fois par requête, recommandé par l'advisor perf).
- `public.is_admin()` est `security definer stable` avec `set search_path = ''` : c'est elle qui évite la récursion RLS sur `profiles`.

## Fonctions
- `security definer` + `set search_path = ''` + noms qualifiés `public.table`.
- Révoquer `execute` de `anon` si la fonction exige un utilisateur, vérifier `auth.uid()` en tête.
- Les opérations multi-tables (ex. `checkout`) se font en une seule fonction = une transaction, avec `select ... for update` sur les lignes de stock.

## Vues KPI
- `create view public.kpi_x with (security_invoker = true) as ...`
- La vue lit des tables protégées par RLS ; pour qu'elle ne soit visible qu'aux admins, ajouter `where public.is_admin()` dans la vue.
- Préfixe `kpi_`, colonnes en snake_case lisibles côté front.

## Ajouter une table (process)
1. Charger cette skill.
2. Écrire la table + contraintes + index + RLS + policies dans une nouvelle migration.
3. Si l'info est un indicateur : ajouter la vue `kpi_` (voir skill `kpi-dashboard`).
4. Mettre à jour `src/lib/types.ts` et le diagramme Mermaid du README.
5. `apply_migration` → `get_advisors` → commit `feat(db): ...`.
