-- Changement de marque : DÉCIBEL -> LIGNE ROUGE
-- Références produit DB-XX-NN -> LR-XX-NN, code promo DECIBEL10 -> ROUGE10,
-- comptes de démonstration @decibel.fr -> @ligne-rouge.fr. Idempotent.

alter table public.products drop constraint if exists products_ref_check;
update public.products set ref = 'LR-' || substr(ref, 4) where ref like 'DB-%';
alter table public.products add constraint products_ref_check check (ref ~ '^LR-[A-Z]{2}-[0-9]{2}$');

update public.promo_codes set code = 'ROUGE10' where code = 'DECIBEL10';
update public.orders set promo_code = 'ROUGE10' where promo_code = 'DECIBEL10';

-- Comptes de démo (données, pas de schéma) : email, identité et profil alignés
update auth.users
   set email = replace(replace(email, '@demo.decibel.fr', '@demo.ligne-rouge.fr'), '@decibel.fr', '@ligne-rouge.fr')
 where email like '%decibel.fr';
update auth.identities i
   set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(u.email))
  from auth.users u
 where u.id = i.user_id and i.provider = 'email' and i.identity_data ->> 'email' like '%decibel.fr';
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id and p.email like '%decibel.fr';
update auth.users
   set encrypted_password = extensions.crypt('LigneRouge#Admin2026', extensions.gen_salt('bf')),
       raw_user_meta_data = raw_user_meta_data || '{"full_name":"Admin LIGNE ROUGE"}'
 where email = 'admin@ligne-rouge.fr';
update public.profiles set full_name = 'Admin LIGNE ROUGE' where email = 'admin@ligne-rouge.fr';
