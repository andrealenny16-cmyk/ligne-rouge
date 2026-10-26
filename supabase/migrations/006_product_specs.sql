-- Fiche technique affichée sur les visuels produit : diamètre de sortie et points forts.
alter table public.products
  add column if not exists tip_diameter_mm smallint check (tip_diameter_mm between 30 and 160),
  add column if not exists features text[] not null default '{}' check (cardinality(features) <= 4);

update public.products p
   set tip_diameter_mm = v.d, features = v.f
  from (values
    ('titan-gt',       102, array['Titane grade 2', 'Embouts carbone', 'Soudure TIG main']),
    ('carbon-fury',    100, array['Valve pilotée', 'Inox céramique noir', 'Embouts carbone']),
    ('inferno-r',      115, array['Décatalysée', 'Titane bleu chauffe', 'Son race']),
    ('spectre-s',       60, array['Titane noir DLC', 'Embout carbone', 'Raccord titane']),
    ('viper-twin',      50, array['Double sous-selle', 'Inox poli', 'Embouts carbone']),
    ('hellcat-racing',  60, array['Ligne 4-en-1', 'Collecteurs titane', 'Silencieux type MotoGP'])
  ) as v(slug, d, f)
 where p.slug = v.slug;
