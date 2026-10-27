-- Entonnoir de conversion : vue produit → ajout au panier → commande
-- Exploite la table events (déjà alimentée par le site) et les commandes.

-- Entonnoir global, une ligne par étape (30 derniers jours)
create or replace view public.kpi_conversion_funnel with (security_invoker = true) as
with steps as (
  select 1 as step, 'Vues produit' as label,
         (select count(*) from public.events
           where type = 'view_product' and created_at >= now() - interval '30 days') as total
  union all
  select 2, 'Ajouts au panier',
         (select count(*) from public.events
           where type = 'add_to_cart' and created_at >= now() - interval '30 days')
  union all
  select 3, 'Commandes',
         (select count(*) from public.orders
           where status <> 'annulee' and created_at >= now() - interval '30 days')
)
select step,
       label,
       total,
       -- taux par rapport à l'étape précédente
       round(100.0 * total / nullif(lag(total) over (order by step), 0), 1) as rate_from_previous,
       -- taux par rapport aux vues produit
       round(100.0 * total / nullif(first_value(total) over (order by step), 0), 1) as rate_from_views
  from steps
 where public.is_admin()
 order by step;
