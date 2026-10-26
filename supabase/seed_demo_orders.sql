-- =====================================================================
-- DÉCIBEL — données de DÉMONSTRATION pour le dashboard admin
-- À exécuter une fois après 001_init.sql (console SQL Supabase).
--   * compte admin de démo : admin@decibel.fr / Decibel#Admin2026
--   * 8 clients fictifs     : prenom@demo.decibel.fr / Demo#Client2026
--   * ~40 commandes réparties sur 30 jours, garages, events, logs IA
-- Ces commandes ne décrémentent pas le stock (démo uniquement).
-- =====================================================================

-- Création d'un utilisateur Supabase Auth confirmé (email + mot de passe)
create or replace function pg_temp.create_demo_user(p_email text, p_password text, p_name text)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is not null then
    return v_id;
  end if;
  v_id := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name),
    now() - interval '35 days', now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
  return v_id;
end;
$$;

do $$
declare
  v_admin   uuid;
  v_clients uuid[] := '{}';
  v_uid     uuid;
  v_order   uuid;
  v_date    timestamptz;
  v_sub     numeric(10,2);
  v_status  public.order_status;
  v_age     int;
  r         record;
  i         int;
  n         int;
  names     text[] := array['Julien','Sofiane','Camille','Thomas','Léa','Nicolas','Inès','Hugo'];
begin
  perform setseed(0.42);

  -- Admin
  v_admin := pg_temp.create_demo_user('admin@decibel.fr', 'Decibel#Admin2026', 'Admin DÉCIBEL');
  update public.profiles set role = 'admin' where id = v_admin;

  -- Clients fictifs + une adresse + un véhicule au garage
  for i in 1 .. array_length(names, 1) loop
    v_uid := pg_temp.create_demo_user(
      lower(translate(names[i], 'éèÉ', 'eeE')) || '@demo.decibel.fr', 'Demo#Client2026', names[i] || ' (démo)');
    v_clients := v_clients || v_uid;
    update public.profiles set created_at = now() - ((30 - i * 3) || ' days')::interval where id = v_uid;

    insert into public.addresses (user_id, label, line1, city, zip, is_default)
    select v_uid, 'Domicile', (10 + i) || ' rue du Circuit', c.city, c.zip, true
      from (values ('Lyon','69003'), ('Paris','75011'), ('Marseille','13008'), ('Nantes','44000'),
                   ('Lille','59000'), ('Bordeaux','33000'), ('Toulouse','31000'), ('Magny-Cours','58470')) c(city, zip)
     offset i - 1 limit 1
    on conflict do nothing;

    insert into public.garage_vehicles (user_id, model_id, year, nickname)
    select v_uid, m.id, greatest(m.year_from, 2023), 'Ma ' || m.name
      from public.vehicle_models m
     order by random() limit 1;
  end loop;

  -- ~40 commandes sur 30 jours
  for i in 1 .. 40 loop
    v_uid  := v_clients[1 + floor(random() * array_length(v_clients, 1))::int];
    v_age  := floor(random() * 30)::int;
    v_date := date_trunc('day', now()) - (v_age || ' days')::interval + (8 + random() * 13) * interval '1 hour';
    v_status := case
      when random() < 0.06 then 'annulee'
      when v_age > 12 then 'livree'
      when v_age > 6  then 'expediee'
      when v_age > 2  then 'preparation'
      else 'payee' end;

    insert into public.orders (user_id, status, subtotal, discount, shipping, total, circuit_ack, address_snapshot, created_at)
    select v_uid, v_status, 0, 0, 0, 0, true,
           jsonb_build_object('label', a.label, 'line1', a.line1, 'city', a.city, 'zip', a.zip, 'country', a.country),
           v_date
      from public.addresses a where a.user_id = v_uid limit 1
    returning id into v_order;

    n := case when random() < 0.2 then 2 else 1 end;
    insert into public.order_items (order_id, product_id, variant_id, product_name, color_name, unit_price, quantity)
    select v_order, p.id, v.id, p.name, v.color_name, coalesce(p.promo_price, p.price), 1
      from public.product_variants v join public.products p on p.id = v.product_id
     order by random() limit n;

    select sum(unit_price * quantity) into v_sub from public.order_items where order_id = v_order;
    update public.orders
       set subtotal = v_sub,
           discount = case when i % 7 = 0 then round(v_sub * 0.10, 2) else 0 end,
           promo_code = case when i % 7 = 0 then 'DECIBEL10' end,
           total = v_sub - case when i % 7 = 0 then round(v_sub * 0.10, 2) else 0 end
     where id = v_order;

    insert into public.events (user_id, type, metadata, created_at)
    values (v_uid, 'checkout', jsonb_build_object('order_id', v_order, 'demo', true), v_date);
  end loop;

  -- Trafic : vues produit et ajouts panier (taux de conversion réaliste)
  for r in select id from public.products loop
    insert into public.events (user_id, type, product_id, metadata, created_at)
    select case when random() < 0.4 then v_clients[1 + floor(random() * 8)::int] end,
           'view_product', r.id, '{"demo":true}', now() - random() * interval '30 days'
      from generate_series(1, 90 + floor(random() * 60)::int);
    insert into public.events (user_id, type, product_id, metadata, created_at)
    select v_clients[1 + floor(random() * 8)::int], 'add_to_cart', r.id, '{"demo":true}', now() - random() * interval '30 days'
      from generate_series(1, 15 + floor(random() * 15)::int);
  end loop;

  -- Vérifications de compatibilité et requêtes configurateur
  insert into public.events (type, metadata, created_at)
  select 'compat_check', jsonb_build_object('model_id', m.id, 'demo', true), now() - random() * interval '30 days'
    from public.vehicle_models m, generate_series(1, 1 + floor(random() * 6)::int);

  insert into public.ai_configurator_logs (vehicle_input, wish, matched_model_id, response, recommended_products, engine, created_at)
  select mk.name || ' ' || m.name, 'Un son plus présent, démo', m.id,
         'Recommandation de démonstration.', coalesce(array_agg(pc.product_id) filter (where pc.product_id is not null), '{}'), 'regles',
         now() - random() * interval '30 days'
    from public.vehicle_models m
    join public.vehicle_makes mk on mk.id = m.make_id
    left join public.product_compatibility pc on pc.model_id = m.id
    cross join generate_series(1, 2) g
   group by m.id, mk.name, m.name, g;

  -- Deux paniers en cours
  insert into public.cart_items (user_id, variant_id, quantity)
  select v_clients[k], (select id from public.product_variants order by random() limit 1), 1
    from generate_series(1, 2) k
  on conflict do nothing;
end $$;
