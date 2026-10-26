-- Refonte réaliste : les images produit pointent vers de vraies photos (public/photos/,
-- voir docs/prompts-photos.md) et chaque produit gagne une 3e vue « monté sur véhicule ».
-- Les URL restent remplaçables par des fichiers Supabase Storage.

update public.product_images i
   set url = '/photos/' || p.slug || case i.position when 0 then '-34.jpg' else '-profil.jpg' end
  from public.products p
 where p.id = i.product_id and i.url like '/products/%';

insert into public.product_images (product_id, url, alt, position)
select p.id, '/photos/' || p.slug || '-monte.jpg', p.name || ' — monté', 2
  from public.products p
on conflict (product_id, position) do nothing;
