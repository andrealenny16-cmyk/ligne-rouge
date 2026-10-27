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

-- Conversion par produit : où le client décroche-t-il ?
create or replace view public.kpi_conversion_by_product with (security_invoker = true) as
with ev as (
  select product_id,
         count(*) filter (where type = 'view_product') as views,
         count(*) filter (where type = 'add_to_cart')  as add_to_cart
    from public.events
   where product_id is not null
     and created_at >= now() - interval '30 days'
   group by product_id
), sold as (
  select oi.product_id, sum(oi.quantity) as units_sold
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
   where o.status <> 'annulee'
     and o.created_at >= now() - interval '30 days'
   group by oi.product_id
)
select p.id as product_id,
       p.name,
       p.slug,
       coalesce(ev.views, 0)        as views,
       coalesce(ev.add_to_cart, 0)  as add_to_cart,
       coalesce(sold.units_sold, 0) as units_sold,
       round(100.0 * coalesce(ev.add_to_cart, 0) / nullif(ev.views, 0), 1)          as view_to_cart_rate,
       round(100.0 * coalesce(sold.units_sold, 0) / nullif(ev.add_to_cart, 0), 1)   as cart_to_order_rate
  from public.products p
  left join ev   on ev.product_id = p.id
  left join sold on sold.product_id = p.id
 where p.is_active and public.is_admin()
 order by views desc, p.name;
