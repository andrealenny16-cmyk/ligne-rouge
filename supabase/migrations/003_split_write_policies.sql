-- Suite à get_advisors (performance, lint 0006) : les policies "for all"
-- se cumulaient avec les policies "select". On les remplace par des
-- policies insert / update / delete distinctes : une seule policy par action.

do $$
declare
  t record;
begin
  -- Catalogue : écriture réservée aux admins
  for t in select * from (values
      ('vehicle_makes',         'makes: écriture admin'),
      ('vehicle_models',        'models: écriture admin'),
      ('categories',            'categories: écriture admin'),
      ('products',              'products: écriture admin'),
      ('product_variants',      'variants: écriture admin'),
      ('product_images',        'images: écriture admin'),
      ('product_compatibility', 'compat: écriture admin')
    ) as x(tbl, pol)
  loop
    execute format('drop policy %I on public.%I', t.pol, t.tbl);
    execute format('create policy %I on public.%I for insert with check (public.is_admin())', t.tbl || ': insert admin', t.tbl);
    execute format('create policy %I on public.%I for update using (public.is_admin()) with check (public.is_admin())', t.tbl || ': update admin', t.tbl);
    execute format('create policy %I on public.%I for delete using (public.is_admin())', t.tbl || ': delete admin', t.tbl);
  end loop;

  -- Données client : écriture réservée au propriétaire
  for t in select * from (values
      ('addresses',       'addresses: écriture propriétaire'),
      ('garage_vehicles', 'garage: écriture propriétaire'),
      ('cart_items',      'cart: écriture propriétaire'),
      ('favorites',       'favorites: écriture propriétaire')
    ) as x(tbl, pol)
  loop
    execute format('drop policy %I on public.%I', t.pol, t.tbl);
    execute format('create policy %I on public.%I for insert with check (user_id = (select auth.uid()))', t.tbl || ': insert propriétaire', t.tbl);
    execute format('create policy %I on public.%I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t.tbl || ': update propriétaire', t.tbl);
    execute format('create policy %I on public.%I for delete using (user_id = (select auth.uid()))', t.tbl || ': delete propriétaire', t.tbl);
  end loop;
end $$;

-- promo_codes : une policy "for all" admin seule ne chevauche rien, on la garde.
