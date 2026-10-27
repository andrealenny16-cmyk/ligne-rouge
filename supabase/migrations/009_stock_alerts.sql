-- Alertes « Prévenez-moi du retour en stock »
-- Un client s'abonne à un coloris épuisé ; quand le stock du coloris repasse
-- au-dessus de 0, un trigger marque l'alerte comme disponible (notified_at).

create table public.stock_alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  variant_id   uuid not null references public.product_variants (id) on delete cascade,
  created_at   timestamptz not null default now(),
  notified_at  timestamptz,
  unique (user_id, variant_id)
);
-- (user_id, variant_id) est déjà couvert par la contrainte unique
create index stock_alerts_variant_id_idx on public.stock_alerts (variant_id);
-- alertes en attente : seules lignes lues par le trigger
create index stock_alerts_pending_idx on public.stock_alerts (variant_id) where notified_at is null;
alter table public.stock_alerts enable row level security;

create policy "stock_alerts: lecture propriétaire ou admin" on public.stock_alerts
  for select using (user_id = (select auth.uid()) or public.is_admin());
-- on ne peut s'abonner qu'à un coloris réellement épuisé
create policy "stock_alerts: insert propriétaire" on public.stock_alerts
  for insert with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.product_variants v where v.id = variant_id and v.stock = 0)
  );
create policy "stock_alerts: delete propriétaire" on public.stock_alerts
  for delete using (user_id = (select auth.uid()));
-- pas de policy update : notified_at n'est écrit que par le trigger

-- Retour en stock : 0 → n > 0 sur une variante
create or replace function public.notify_stock_alerts()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.stock = 0 and new.stock > 0 then
    update public.stock_alerts
       set notified_at = now()
     where variant_id = new.id
       and notified_at is null;
  end if;
  return null;
end;
$$;
revoke execute on function public.notify_stock_alerts() from public, anon, authenticated;

create trigger product_variants_notify_stock_alerts
  after update of stock on public.product_variants
  for each row execute function public.notify_stock_alerts();

-- KPI : demande sur les coloris épuisés (aide à prioriser le réassort)
create or replace view public.kpi_stock_demand with (security_invoker = true) as
select v.id as variant_id,
       p.name,
       p.slug,
       v.color_name,
       v.stock,
       count(*) filter (where a.notified_at is null)     as waiting,
       count(*) filter (where a.notified_at is not null) as notified
  from public.stock_alerts a
  join public.product_variants v on v.id = a.variant_id
  join public.products p on p.id = v.product_id
 where public.is_admin()
 group by v.id, p.name, p.slug, v.color_name, v.stock
 order by waiting desc, notified desc, p.name;
