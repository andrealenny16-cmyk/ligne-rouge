-- =====================================================================
-- DÉCIBEL Performance — schéma initial
-- Conventions : voir .claude/skills/supabase-migrations/SKILL.md
--   * RLS activée sur toutes les tables
--   * (select auth.uid()) dans les policies
--   * fonctions security definer avec search_path = ''
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Types énumérés
-- ---------------------------------------------------------------------
create type public.app_role      as enum ('client', 'admin');
create type public.vehicle_type  as enum ('voiture', 'moto');
create type public.material_type as enum ('titane', 'inox', 'carbone');
create type public.usage_type    as enum ('route', 'circuit');
create type public.order_status  as enum ('payee', 'preparation', 'expediee', 'livree', 'annulee');
create type public.event_type    as enum ('view_product', 'add_to_cart', 'remove_from_cart', 'checkout', 'compat_check');

-- ---------------------------------------------------------------------
-- 1. Utilisateurs
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  role        public.app_role not null default 'client',
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Fonction pivot des policies admin. security definer : lit profiles
-- sans repasser par la RLS de profiles (évite la récursion).
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create policy "profiles: lecture propriétaire ou admin" on public.profiles
  for select using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: mise à jour propriétaire ou admin" on public.profiles
  for update using (id = (select auth.uid()) or public.is_admin());

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un client ne peut pas s'auto-promouvoir. Les opérations SQL hors
-- session (auth.uid() null : console, service_role) restent possibles.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Modification du rôle interdite' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null default 'Domicile',
  line1       text not null,
  city        text not null,
  zip         text not null check (zip ~ '^[0-9A-Za-z -]{3,10}$'),
  country     text not null default 'France',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses (user_id);
-- une seule adresse par défaut par client
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;
alter table public.addresses enable row level security;

create policy "addresses: lecture propriétaire ou admin" on public.addresses
  for select using (user_id = (select auth.uid()) or public.is_admin());
create policy "addresses: écriture propriétaire" on public.addresses
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 2. Véhicules et compatibilité
-- ---------------------------------------------------------------------
create table public.vehicle_makes (
  id    smallint generated always as identity primary key,
  name  text not null,
  type  public.vehicle_type not null,
  unique (name, type)
);
alter table public.vehicle_makes enable row level security;

create table public.vehicle_models (
  id          integer generated always as identity primary key,
  make_id     smallint not null references public.vehicle_makes (id) on delete restrict,
  name        text not null,
  generation  text,
  year_from   smallint not null,
  year_to     smallint,
  engine      text,
  power_hp    smallint,
  check (year_to is null or year_to >= year_from),
  unique (make_id, name, generation)
);
create index vehicle_models_make_id_idx on public.vehicle_models (make_id);
alter table public.vehicle_models enable row level security;

create table public.garage_vehicles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  model_id    integer not null references public.vehicle_models (id) on delete restrict,
  year        smallint not null check (year between 1980 and 2030),
  nickname    text,
  created_at  timestamptz not null default now()
);
create index garage_vehicles_user_id_idx on public.garage_vehicles (user_id);
create index garage_vehicles_model_id_idx on public.garage_vehicles (model_id);
alter table public.garage_vehicles enable row level security;

create policy "garage: lecture propriétaire ou admin" on public.garage_vehicles
  for select using (user_id = (select auth.uid()) or public.is_admin());
create policy "garage: écriture propriétaire" on public.garage_vehicles
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 3. Catalogue
-- ---------------------------------------------------------------------
create table public.categories (
  id    smallint generated always as identity primary key,
  name  text not null unique,
  slug  text not null unique
);
alter table public.categories enable row level security;

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  ref               text not null unique check (ref ~ '^DB-[A-Z]{2}-[0-9]{2}$'),
  name              text not null,
  slug              text not null unique,
  category_id       smallint not null references public.categories (id) on delete restrict,
  vehicle_type      public.vehicle_type not null,
  tagline           text,
  description       text not null,
  material          public.material_type not null,
  usage             public.usage_type not null,
  db_level          smallint not null check (db_level between 60 and 140),
  db_level_max      smallint check (db_level_max is null or db_level_max >= db_level),
  hp_gain           smallint not null default 0 check (hp_gain >= 0),
  torque_gain       smallint not null default 0 check (torque_gain >= 0),
  weight_saving_kg  numeric(4,1) not null default 0,
  install_minutes   smallint not null check (install_minutes > 0),
  price             numeric(10,2) not null check (price > 0),
  promo_price       numeric(10,2) check (promo_price is null or (promo_price > 0 and promo_price < price)),
  stock             integer not null default 0 check (stock >= 0),  -- somme des variantes (trigger)
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_type_usage_idx on public.products (vehicle_type, usage);
alter table public.products enable row level security;

create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  color_name  text not null,
  color_hex   text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  stock       integer not null default 0 check (stock >= 0),
  unique (product_id, color_name)
);
create index product_variants_product_id_idx on public.product_variants (product_id);
alter table public.product_variants enable row level security;

-- products.stock reste la somme des stocks variantes
create or replace function public.sync_product_stock()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_product uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set stock = coalesce((select sum(stock) from public.product_variants where product_id = v_product), 0)
   where p.id = v_product;
  return null;
end;
$$;

create trigger product_variants_sync_stock
  after insert or update of stock or delete on public.product_variants
  for each row execute function public.sync_product_stock();

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text,
  position    smallint not null default 0,
  unique (product_id, position)
);
alter table public.product_images enable row level security;

create table public.product_compatibility (
  product_id  uuid not null references public.products (id) on delete cascade,
  model_id    integer not null references public.vehicle_models (id) on delete cascade,
  primary key (product_id, model_id)
);
create index product_compatibility_model_id_idx on public.product_compatibility (model_id);
alter table public.product_compatibility enable row level security;

create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete set null,
  author_name  text not null,
  rating       smallint not null check (rating between 1 and 5),
  comment      text not null check (length(comment) between 3 and 2000),
  is_demo      boolean not null default false,  -- avis fictifs de démonstration
  created_at   timestamptz not null default now()
);
create index reviews_product_id_idx on public.reviews (product_id);
create index reviews_user_id_idx on public.reviews (user_id);
alter table public.reviews enable row level security;

-- Catalogue : lecture publique, écriture admin
create policy "makes: lecture publique" on public.vehicle_makes for select using (true);
create policy "makes: écriture admin" on public.vehicle_makes for all using (public.is_admin()) with check (public.is_admin());
create policy "models: lecture publique" on public.vehicle_models for select using (true);
create policy "models: écriture admin" on public.vehicle_models for all using (public.is_admin()) with check (public.is_admin());
create policy "categories: lecture publique" on public.categories for select using (true);
create policy "categories: écriture admin" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "products: lecture publique des actifs" on public.products for select using (is_active or public.is_admin());
create policy "products: écriture admin" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "variants: lecture publique" on public.product_variants for select using (true);
create policy "variants: écriture admin" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "images: lecture publique" on public.product_images for select using (true);
create policy "images: écriture admin" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "compat: lecture publique" on public.product_compatibility for select using (true);
create policy "compat: écriture admin" on public.product_compatibility for all using (public.is_admin()) with check (public.is_admin());
create policy "reviews: lecture publique" on public.reviews for select using (true);
create policy "reviews: un client poste en son nom" on public.reviews
  for insert to authenticated with check (user_id = (select auth.uid()) and not is_demo);
create policy "reviews: suppression auteur ou admin" on public.reviews
  for delete using (user_id = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Achat
-- ---------------------------------------------------------------------
create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  variant_id  uuid not null references public.product_variants (id) on delete cascade,
  quantity    integer not null check (quantity between 1 and 10),
  added_at    timestamptz not null default now(),
  unique (user_id, variant_id)
);
create index cart_items_variant_id_idx on public.cart_items (variant_id);
alter table public.cart_items enable row level security;

create policy "cart: lecture propriétaire ou admin" on public.cart_items
  for select using (user_id = (select auth.uid()) or public.is_admin());
create policy "cart: écriture propriétaire" on public.cart_items
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.promo_codes (
  id           smallint generated always as identity primary key,
  code         text not null unique check (code = upper(code)),
  percent_off  smallint not null check (percent_off between 1 and 90),
  valid_until  timestamptz,
  max_uses     integer check (max_uses is null or max_uses > 0),
  uses         integer not null default 0 check (uses >= 0)
);
alter table public.promo_codes enable row level security;
-- aucune lecture publique : validation via validate_promo()
create policy "promo: gestion admin" on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete restrict,
  status            public.order_status not null default 'payee',
  subtotal          numeric(10,2) not null check (subtotal >= 0),
  discount          numeric(10,2) not null default 0 check (discount >= 0),
  shipping          numeric(10,2) not null default 0 check (shipping >= 0),
  total             numeric(10,2) not null check (total >= 0),
  promo_code        text,
  circuit_ack       boolean not null default false,
  address_snapshot  jsonb not null,
  created_at        timestamptz not null default now()
);
create index orders_user_id_idx on public.orders (user_id);
create index orders_created_at_idx on public.orders (created_at);
create index orders_status_idx on public.orders (status);
alter table public.orders enable row level security;

create policy "orders: lecture propriétaire ou admin" on public.orders
  for select using (user_id = (select auth.uid()) or public.is_admin());
-- création uniquement via checkout() ; statut modifiable par l'admin
create policy "orders: mise à jour admin" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  variant_id    uuid references public.product_variants (id) on delete set null,
  product_name  text not null,       -- figé au moment de l'achat
  color_name    text not null,
  unit_price    numeric(10,2) not null check (unit_price >= 0),  -- figé au moment de l'achat
  quantity      integer not null check (quantity > 0)
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index order_items_variant_id_idx on public.order_items (variant_id);
alter table public.order_items enable row level security;

create policy "order_items: lecture via la commande" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin()))
  );

create table public.favorites (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index favorites_product_id_idx on public.favorites (product_id);
alter table public.favorites enable row level security;

create policy "favorites: lecture propriétaire ou admin" on public.favorites
  for select using (user_id = (select auth.uid()) or public.is_admin());
create policy "favorites: écriture propriétaire" on public.favorites
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 5. Tracking et IA
-- ---------------------------------------------------------------------
create table public.events (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles (id) on delete set null,
  type        public.event_type not null,
  product_id  uuid references public.products (id) on delete set null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index events_type_created_idx on public.events (type, created_at);
create index events_user_id_idx on public.events (user_id);
create index events_product_id_idx on public.events (product_id);
alter table public.events enable row level security;

create policy "events: insertion visiteur ou client" on public.events
  for insert with check (user_id is null or user_id = (select auth.uid()));
create policy "events: lecture admin" on public.events for select using (public.is_admin());

create table public.ai_configurator_logs (
  id                    bigint generated always as identity primary key,
  user_id               uuid references public.profiles (id) on delete set null,
  vehicle_input         text not null,
  wish                  text,
  matched_model_id      integer references public.vehicle_models (id) on delete set null,
  response              text not null,
  recommended_products  uuid[] not null default '{}',
  engine                text not null check (engine in ('ia', 'regles')),
  created_at            timestamptz not null default now()
);
create index ai_logs_user_id_idx on public.ai_configurator_logs (user_id);
create index ai_logs_model_id_idx on public.ai_configurator_logs (matched_model_id);
alter table public.ai_configurator_logs enable row level security;

create policy "ai_logs: insertion visiteur ou client" on public.ai_configurator_logs
  for insert with check (user_id is null or user_id = (select auth.uid()));
create policy "ai_logs: lecture admin" on public.ai_configurator_logs for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. Fonctions métier
-- ---------------------------------------------------------------------

-- Vérifie un code promo sans exposer la table promo_codes
create or replace function public.validate_promo(p_code text)
returns smallint
language sql stable security definer set search_path = ''
as $$
  select percent_off from public.promo_codes
  where code = upper(trim(p_code))
    and (valid_until is null or valid_until > now())
    and (max_uses is null or uses < max_uses);
$$;

-- Passage de commande atomique : verrouille, contrôle, facture, décrémente, vide.
create or replace function public.checkout(
  p_address_id  uuid,
  p_promo_code  text default null,
  p_circuit_ack boolean default false
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_addr       public.addresses;
  v_promo      public.promo_codes;
  v_subtotal   numeric(10,2);
  v_discount   numeric(10,2) := 0;
  v_shipping   numeric(10,2);
  v_has_circ   boolean;
  v_order_id   uuid;
  r            record;
begin
  if v_uid is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  select * into v_addr from public.addresses where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception 'Adresse de livraison introuvable';
  end if;

  if not exists (select 1 from public.cart_items where user_id = v_uid) then
    raise exception 'Panier vide';
  end if;

  -- Verrou des lignes de stock concernées (évite la survente concurrente)
  perform 1
    from public.product_variants v
    join public.cart_items c on c.variant_id = v.id
   where c.user_id = v_uid
     for update of v;

  for r in
    select c.quantity, v.stock, v.color_name, p.name, p.is_active
      from public.cart_items c
      join public.product_variants v on v.id = c.variant_id
      join public.products p on p.id = v.product_id
     where c.user_id = v_uid
  loop
    if not r.is_active then
      raise exception '% n''est plus disponible', r.name;
    end if;
    if r.quantity > r.stock then
      raise exception 'Stock insuffisant pour % (%) : % restant(s)', r.name, r.color_name, r.stock;
    end if;
  end loop;

  select sum(c.quantity * coalesce(p.promo_price, p.price)),
         bool_or(p.usage = 'circuit')
    into v_subtotal, v_has_circ
    from public.cart_items c
    join public.product_variants v on v.id = c.variant_id
    join public.products p on p.id = v.product_id
   where c.user_id = v_uid;

  if v_has_circ and not p_circuit_ack then
    raise exception 'Vous devez reconnaître l''usage exclusif sur circuit';
  end if;

  if nullif(trim(p_promo_code), '') is not null then
    select * into v_promo from public.promo_codes
     where code = upper(trim(p_promo_code))
       for update;
    if not found
       or (v_promo.valid_until is not null and v_promo.valid_until < now())
       or (v_promo.max_uses is not null and v_promo.uses >= v_promo.max_uses) then
      raise exception 'Code promo invalide ou expiré';
    end if;
    v_discount := round(v_subtotal * v_promo.percent_off / 100.0, 2);
    update public.promo_codes set uses = uses + 1 where id = v_promo.id;
  end if;

  -- Livraison offerte dès 500 €
  v_shipping := case when v_subtotal - v_discount >= 500 then 0 else 19.90 end;

  insert into public.orders (user_id, subtotal, discount, shipping, total, promo_code, circuit_ack, address_snapshot)
  values (
    v_uid, v_subtotal, v_discount, v_shipping, v_subtotal - v_discount + v_shipping,
    v_promo.code, coalesce(p_circuit_ack, false),
    jsonb_build_object('label', v_addr.label, 'line1', v_addr.line1, 'city', v_addr.city,
                       'zip', v_addr.zip, 'country', v_addr.country)
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, variant_id, product_name, color_name, unit_price, quantity)
  select v_order_id, p.id, v.id, p.name, v.color_name, coalesce(p.promo_price, p.price), c.quantity
    from public.cart_items c
    join public.product_variants v on v.id = c.variant_id
    join public.products p on p.id = v.product_id
   where c.user_id = v_uid;

  update public.product_variants v
     set stock = v.stock - c.quantity
    from public.cart_items c
   where c.variant_id = v.id and c.user_id = v_uid;

  delete from public.cart_items where user_id = v_uid;

  insert into public.events (user_id, type, metadata)
  values (v_uid, 'checkout', jsonb_build_object('order_id', v_order_id));

  return v_order_id;
end;
$$;

revoke execute on function public.checkout(uuid, text, boolean) from public, anon;
grant execute on function public.checkout(uuid, text, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Vues KPI (admins uniquement : security_invoker + is_admin())
-- ---------------------------------------------------------------------
create or replace view public.kpi_overview with (security_invoker = true) as
select * from (
  select
    coalesce(sum(o.total) filter (where o.status <> 'annulee'), 0)::numeric(12,2)           as revenue,
    count(*) filter (where o.status <> 'annulee')                                            as orders_count,
    coalesce(round(avg(o.total) filter (where o.status <> 'annulee'), 2), 0)                as avg_basket,
    (select count(*) from public.profiles where role = 'client')                             as customers,
    round(100.0 * (select count(*) from public.events where type = 'checkout')
          / nullif((select count(*) from public.events where type = 'view_product'), 0), 2) as conversion_rate,
    (select count(distinct user_id) from public.cart_items)                                  as open_carts,
    (select coalesce(sum(c.quantity * coalesce(p.promo_price, p.price)), 0)
       from public.cart_items c
       join public.product_variants v on v.id = c.variant_id
       join public.products p on p.id = v.product_id)::numeric(12,2)                        as open_carts_value
  from public.orders o
) k
where public.is_admin();

create or replace view public.kpi_revenue_by_day with (security_invoker = true) as
select d::date as day,
       coalesce(sum(o.total), 0)::numeric(12,2) as revenue,
       count(o.id) as orders_count
  from generate_series(current_date - 29, current_date, interval '1 day') d
  left join public.orders o
         on o.created_at::date = d::date and o.status <> 'annulee'
 where public.is_admin()
 group by d
 order by d;

create or replace view public.kpi_top_products with (security_invoker = true) as
select p.id as product_id, p.name, p.ref, p.usage,
       sum(oi.quantity)                         as units,
       sum(oi.quantity * oi.unit_price)::numeric(12,2) as revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id and o.status <> 'annulee'
  join public.products p on p.id = oi.product_id
 where public.is_admin()
 group by p.id, p.name, p.ref, p.usage
 order by revenue desc;

create or replace view public.kpi_route_vs_circuit with (security_invoker = true) as
select p.usage,
       sum(oi.quantity)                         as units,
       sum(oi.quantity * oi.unit_price)::numeric(12,2) as revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id and o.status <> 'annulee'
  join public.products p on p.id = oi.product_id
 where public.is_admin()
 group by p.usage;

create or replace view public.kpi_top_vehicles with (security_invoker = true) as
select m.id as model_id,
       mk.name || ' ' || m.name as vehicle,
       mk.type,
       (select count(*) from public.garage_vehicles g where g.model_id = m.id)                as garage_count,
       (select count(*) from public.ai_configurator_logs l where l.matched_model_id = m.id)   as search_count,
       (select count(*) from public.events e
         where e.type = 'compat_check' and (e.metadata ->> 'model_id')::int = m.id)            as compat_checks
  from public.vehicle_models m
  join public.vehicle_makes mk on mk.id = m.make_id
 where public.is_admin();

create or replace view public.kpi_low_stock with (security_invoker = true) as
select v.id as variant_id, p.name, p.ref, v.color_name, v.stock
  from public.product_variants v
  join public.products p on p.id = v.product_id
 where v.stock <= 3 and public.is_admin()
 order by v.stock, p.name;

-- =====================================================================
-- 8. SEED catalogue
-- =====================================================================
insert into public.categories (name, slug) values
  ('Ligne complète', 'ligne-complete'),
  ('Silencieux slip-on', 'silencieux-slip-on'),
  ('Silencieux arrière', 'silencieux-arriere'),
  ('Embouts', 'embouts');

insert into public.vehicle_makes (name, type) values
  ('Volkswagen', 'voiture'), ('Audi', 'voiture'), ('BMW', 'voiture'), ('Mercedes-AMG', 'voiture'),
  ('Toyota', 'voiture'), ('Cupra', 'voiture'),
  ('BMW', 'moto'), ('Yamaha', 'moto'), ('Kawasaki', 'moto'), ('Ducati', 'moto');

insert into public.vehicle_models (make_id, name, generation, year_from, year_to, engine, power_hp)
select mk.id, v.name, v.gen, v.yf, v.yt, v.engine, v.hp
  from (values
    ('Volkswagen',   'voiture', 'Golf 8 GTI',        'Mk8',  2020, null, '2.0 TSI',        245),
    ('Volkswagen',   'voiture', 'Golf 7 GTI',        'Mk7',  2013, 2020, '2.0 TSI',        230),
    ('Audi',         'voiture', 'S3',                '8Y',   2021, null, '2.0 TFSI',       310),
    ('Audi',         'voiture', 'RS3',               '8Y',   2021, null, '2.5 TFSI',       400),
    ('Cupra',        'voiture', 'Leon VZ',           'KL',   2021, null, '2.0 TSI',        300),
    ('BMW',          'voiture', 'M240i',             'G42',  2022, null, '3.0 B58',        374),
    ('BMW',          'voiture', 'M140i',             'F20',  2016, 2019, '3.0 B58',        340),
    ('Toyota',       'voiture', 'GR Supra 3.0',      'A90',  2019, null, '3.0 B58',        340),
    ('Mercedes-AMG', 'voiture', 'A45 S',             'W177', 2020, null, '2.0 M139',       421),
    ('Mercedes-AMG', 'voiture', 'CLA 45 S',          'C118', 2020, null, '2.0 M139',       421),
    ('BMW',          'moto',    'R 1300 GS',         'K50',  2023, null, '1300 boxer',     145),
    ('BMW',          'moto',    'R 1300 GS Adventure','K51', 2024, null, '1300 boxer',     145),
    ('Yamaha',       'moto',    'MT-09',             'Gen4', 2024, null, '890 CP3',        119),
    ('Yamaha',       'moto',    'Tracer 9 GT',       'RN70', 2021, null, '890 CP3',        119),
    ('Yamaha',       'moto',    'XSR900',            'RN80', 2022, null, '890 CP3',        119),
    ('Yamaha',       'moto',    'R1',                'RN65', 2020, null, '998 crossplane', 200),
    ('Kawasaki',     'moto',    'Ninja ZX-10R',      'ZXT02',2021, null, '998 4 cyl.',     203),
    ('Ducati',       'moto',    'Panigale V4',       'MY22', 2022, null, '1103 Desmosedici', 215)
  ) as v(make, type, name, gen, yf, yt, engine, hp)
  join public.vehicle_makes mk on mk.name = v.make and mk.type = v.type::public.vehicle_type;

insert into public.products
  (ref, name, slug, category_id, vehicle_type, tagline, description, material, usage,
   db_level, db_level_max, hp_gain, torque_gain, weight_saving_kg, install_minutes, price, promo_price)
select v.ref, v.name, v.slug, c.id, v.vt::public.vehicle_type, v.tagline, v.descr,
       v.mat::public.material_type, v.usage::public.usage_type,
       v.db, v.dbmax, v.hp, v.nm, v.kg, v.mins, v.price, v.promo
  from (values
    ('DB-GT-01', 'TITAN GT', 'titan-gt', 'Ligne complète', 'voiture',
     'Ligne cat-back titane, quatre sorties carbone.',
     'Une ligne cat-back intégralement en titane grade 2, soudée à la main, qui libère un grave rond au ralenti et un rugissement métallique au-delà de 4 000 tr/min. Les quatre sorties Ø 102 mm à embouts carbone signent l''arrière de la voiture sans en faire trop. Moins 7,8 kg sur le train arrière : la voiture se place plus vite et répond plus franchement à chaque appel de gaz.',
     'titane', 'route', 92, null::int, 12, 18, 7.8, 180, 2890.00, 2601.00),
    ('DB-CF-02', 'CARBON FURY', 'carbon-fury', 'Silencieux arrière', 'voiture',
     'Silencieux à valve pilotée, deux humeurs.',
     'Un silencieux arrière en inox équipé d''une valve pilotée : en mode discret, il reste civilisé pour les départs matinaux ; en mode Sport, la valve s''ouvre et le six-cylindres chante à pleine voix. La double sortie carbone tissé encadre parfaitement le diffuseur. Montage en 1 h 30 sur les fixations d''origine, sans découpe.',
     'inox', 'route', 88, 96, 8, 10, 4.2, 90, 1690.00, null),
    ('DB-IR-03', 'INFERNO R', 'inferno-r', 'Ligne complète', 'voiture',
     'Ligne décatalysée titane, pure piste.',
     'INFERNO R est une ligne complète décatalysée en titane, pensée pour le chrono et rien d''autre. Les quatre sorties Ø 115 mm « bleu chauffe » crachent des détonations sèches au rétrogradage et un hurlement continu en pleine charge. Avec +28 ch et 11,5 kg en moins, la voiture change de caractère dès le premier tour.',
     'titane', 'circuit', 112, null, 28, 35, 11.5, 240, 4490.00, null),
    ('DB-SS-04', 'SPECTRE S', 'spectre-s', 'Silencieux slip-on', 'moto',
     'Slip-on titane noir pour le boxer 1300.',
     'Le SPECTRE S donne au boxer 1300 une voix grave et pulsée, sans fatigue sur les longues étapes. Son corps en titane noir et son double embout carbone affinent la ligne arrière de la GS. Il se monte en 25 minutes grâce au raccord titane fourni, et retire près de 4 kg haut perché sur la moto.',
     'titane', 'route', 94, null, 4, 0, 3.9, 25, 1249.00, 1037.00),
    ('DB-VT-05', 'VIPER TWIN', 'viper-twin', 'Silencieux slip-on', 'moto',
     'Double silencieux sous-selle pour le CP3.',
     'Deux silencieux inox logés sous la selle, comme sur les sportives des années 2000, pour un look radical et une sonorité rauque qui sublime le trois-cylindres CP3. Les embouts carbone dépassent juste ce qu''il faut. Les montées en régime deviennent rageuses et la moto gagne 6 ch sur toute la plage.',
     'inox', 'route', 96, null, 6, 0, 4.6, 45, 1590.00, null),
    ('DB-HR-06', 'HELLCAT RACING', 'hellcat-racing', 'Ligne complète', 'moto',
     'Ligne 4-en-1 titane, silencieux type MotoGP.',
     'Une ligne complète 4-en-1 en titane avec collecteurs à longueur accordée et silencieux court inspiré des machines de MotoGP. Le cri à 14 000 tr/min est aussi brutal que la poussée qui l''accompagne. 6,8 kg gagnés et +12 ch : la moto devient plus vive en entrée de virage et plus féroce à la réaccélération.',
     'titane', 'circuit', 110, null, 12, 0, 6.8, 120, 2790.00, null)
  ) as v(ref, name, slug, cat, vt, tagline, descr, mat, usage, db, dbmax, hp, nm, kg, mins, price, promo)
  join public.categories c on c.name = v.cat;

insert into public.product_variants (product_id, color_name, color_hex, stock)
select p.id, v.color, v.hex, v.stock
  from (values
    ('DB-GT-01', 'Titane brut', '#B8B5AE', 5), ('DB-GT-01', 'Noir mat',  '#1C1C1E', 4),
    ('DB-CF-02', 'Noir mat',    '#1C1C1E', 4), ('DB-CF-02', 'Carbone',   '#2E2E30', 3),
    ('DB-IR-03', 'Bleu chauffe','#4F6BD8', 2), ('DB-IR-03', 'Titane brut','#B8B5AE', 2),
    ('DB-SS-04', 'Noir',        '#111113', 6), ('DB-SS-04', 'Titane brut','#B8B5AE', 5),
    ('DB-VT-05', 'Noir',        '#111113', 3), ('DB-VT-05', 'Carbone',   '#2E2E30', 3),
    ('DB-HR-06', 'Titane brut', '#B8B5AE', 2), ('DB-HR-06', 'Bleu chauffe','#4F6BD8', 1)
  ) as v(ref, color, hex, stock)
  join public.products p on p.ref = v.ref;

insert into public.product_images (product_id, url, alt, position)
select p.id, '/products/' || p.slug || s.suffix, p.name || s.label, s.pos
  from public.products p
  cross join (values ('-34.svg', ' — vue 3/4 avant', 0), ('-profil.svg', ' — vue de profil', 1)) as s(suffix, label, pos);

insert into public.product_compatibility (product_id, model_id)
select p.id, m.id
  from (values
    ('DB-GT-01', 'Golf 8 GTI'), ('DB-GT-01', 'S3'), ('DB-GT-01', 'Leon VZ'),
    ('DB-CF-02', 'M240i'), ('DB-CF-02', 'M140i'), ('DB-CF-02', 'GR Supra 3.0'),
    ('DB-IR-03', 'A45 S'), ('DB-IR-03', 'CLA 45 S'), ('DB-IR-03', 'RS3'),
    ('DB-SS-04', 'R 1300 GS'), ('DB-SS-04', 'R 1300 GS Adventure'),
    ('DB-VT-05', 'MT-09'), ('DB-VT-05', 'Tracer 9 GT'), ('DB-VT-05', 'XSR900'),
    ('DB-HR-06', 'Ninja ZX-10R'), ('DB-HR-06', 'R1'), ('DB-HR-06', 'Panigale V4')
  ) as v(ref, model)
  join public.products p on p.ref = v.ref
  join public.vehicle_models m on m.name = v.model;

-- Avis : DONNÉES DE DÉMONSTRATION (is_demo = true), prénoms fictifs
insert into public.reviews (product_id, author_name, rating, comment, is_demo, created_at)
select p.id, v.author, v.rating, v.comment, true, now() - (v.days || ' days')::interval
  from (values
    ('DB-GT-01', 'Julien',  5, 'Le grave au ralenti est magnifique et la Golf a enfin une vraie voix. Finition titane irréprochable.', 12),
    ('DB-GT-01', 'Sofiane', 4, 'Montage un peu long seul, mais le résultat vaut chaque minute. Aucun bourdonnement sur autoroute.', 30),
    ('DB-GT-01', 'Camille', 5, 'Les embouts carbone sont superbes, tout le monde se retourne au feu rouge.', 45),
    ('DB-CF-02', 'Thomas',  5, 'La valve change tout : discret le matin, déchaîné le week-end. Le B58 chante.', 8),
    ('DB-CF-02', 'Mehdi',   4, 'Très bon rapport qualité/prix, la sortie carbone est parfaitement alignée au diffuseur.', 22),
    ('DB-IR-03', 'Léa',     5, 'Sur circuit à Magny-Cours, les détonations au rétrogradage sont incroyables. Gain net en sortie de virage.', 15),
    ('DB-IR-03', 'Antoine', 5, 'Brutal. Uniquement pour la piste, mais quelle claque.', 40),
    ('DB-SS-04', 'Nicolas', 5, 'Le boxer gagne en caractère sans fatiguer sur les longues étapes. Montage en 20 minutes.', 10),
    ('DB-SS-04', 'Inès',    4, 'Joli son grave, la teinte noire est très classe sur la GS Triple Black.', 35),
    ('DB-VT-05', 'Kevin',   5, 'Le look sous-selle est dingue sur la MT-09 et le trois-cylindres hurle.', 5),
    ('DB-VT-05', 'Manon',   4, 'Super son, un peu fort sur longs trajets mais on s''y fait vite.', 28),
    ('DB-HR-06', 'Hugo',    5, 'Le cri à 14 000 tr/min… indescriptible. Ma R1 a changé de dimension.', 18),
    ('DB-HR-06', 'Yanis',   5, 'Qualité de soudure parfaite, poids plume. Réservé au circuit, évidemment.', 50)
  ) as v(ref, author, rating, comment, days)
  join public.products p on p.ref = v.ref;

insert into public.promo_codes (code, percent_off, valid_until, max_uses) values
  ('DECIBEL10', 10, '2027-12-31 23:59:59+01', 1000),
  ('LAUNCH20',  20, '2026-12-31 23:59:59+01', 100);
