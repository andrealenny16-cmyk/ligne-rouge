---
name: kpi-dashboard
description: Comment ajouter un nouvel indicateur au dashboard admin LIGNE ROUGE (vue SQL kpi_ → requête serveur → carte ou graphique recharts). À utiliser pour toute demande de nouvelle métrique admin.
---

# Ajouter un KPI au dashboard admin

Chaîne complète : **vue SQL → requête serveur → composant**.

## 1. Vue SQL
Dans une nouvelle migration (skill `supabase-migrations`) :
```sql
create or replace view public.kpi_avg_rating_by_product
with (security_invoker = true) as
select p.name, round(avg(r.rating)::numeric, 2) as avg_rating, count(*) as reviews
from public.reviews r join public.products p on p.id = r.product_id
where public.is_admin()
group by p.name;
```
Règles :
- préfixe `kpi_`, `security_invoker = true`, filtre `where public.is_admin()` ;
- montants en `numeric` arrondis à 2 décimales, dates en `date` ;
- exclure les commandes `annulee` des calculs de CA ;
- une ligne par point de graphique, colonnes déjà nommées pour le front.

## 2. Requête serveur
Dans `src/app/admin/page.tsx` (Server Component), ajouter la requête au `Promise.all` existant :
```ts
supabase.from('kpi_avg_rating_by_product').select('*')
```
Ne jamais requêter les KPI côté client : la page admin est déjà protégée par le middleware **et** par `requireAdmin()`.

## 3. Affichage
- Chiffre unique → `KpiCard` (`src/components/admin/KpiCard.tsx`) : libellé, valeur formatée (`formatPrice` / `formatNumber`), sous-titre.
- Série temporelle → `RevenueChart` (AreaChart recharts, trait en dégradé « titane chauffé »).
- Classement → `BarList` / BarChart horizontal.
- Répartition → `DonutChart` (PieChart `innerRadius`), couleurs : route `#3B82F6`, circuit `#E11D2E`.
Les graphiques recharts sont des Client Components (`'use client'`) qui reçoivent les données en props.

## 4. Vérifier
- Se connecter en admin → la carte s'affiche avec des données (lancer `supabase/seed_demo_orders.sql` si vide).
- Se connecter en client → la vue renvoie 0 ligne (RLS + `is_admin()`).
- Commit : `feat(admin): KPI <nom>`.
