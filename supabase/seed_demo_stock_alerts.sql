-- =====================================================================
-- LIGNE ROUGE — démo des alertes « Me prévenir du retour »
-- À exécuter après 009_stock_alerts.sql et seed_demo_orders.sql (console SQL Supabase).
--   * met en rupture le 1er coloris des 2 premiers pots (ordre des refs)
--   * abonne les clients de démo à ces coloris → carte « Demande en rupture » de l'admin
-- =====================================================================

with ruptures as (
  select distinct on (p.id) v.id
    from public.products p
    join public.product_variants v on v.product_id = p.id
   where p.is_active
   order by p.id, v.color_name
   limit 2
)
update public.product_variants v
   set stock = 0
  from ruptures r
 where v.id = r.id;

insert into public.stock_alerts (user_id, variant_id, created_at)
select pr.id, v.id, now() - (random() * interval '10 days')
  from public.product_variants v
  cross join public.profiles pr
 where v.stock = 0
   and pr.email like '%@demo.ligne-rouge.fr'
   and random() < 0.6
on conflict (user_id, variant_id) do nothing;

-- Démo du trigger pendant la soutenance : remettre du stock sur un coloris,
-- les alertes passent « De retour en stock » dans /compte et en « prévenus » dans l'admin.
--   update public.product_variants set stock = 5
--    where id = (select variant_id from public.stock_alerts limit 1);
