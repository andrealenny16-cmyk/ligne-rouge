---
name: add-product
description: Procédure complète pour ajouter un nouveau pot d'échappement LIGNE ROUGE au catalogue (seed SQL, variantes, photos du pot, compatibilité véhicules). À utiliser dès qu'on ajoute ou duplique un produit.
---

# Ajouter un pot au catalogue

## 1. Fiche produit
Rassembler : nom en capitales, ref `LR-XX-NN` (XX = initiales, NN = numéro suivant), catégorie, `vehicle_type` (`voiture|moto`), matériau (`titane|inox|carbone`), usage (`route|circuit`), dB, ch, Nm, kg gagnés, minutes de montage, prix TTC, promo éventuelle, stock 3–12, 2 coloris (nom + hex).

Règle métier : un produit `circuit` a toujours un dB ≥ 105 et **ne doit jamais** être présenté comme homologué.

## 2. Photos du pot
Trois vues **du même pot** par produit dans `public/photos/` : `<slug>-34.jpg` (image principale), `<slug>-profil.jpg`,
`<slug>-monte.jpg`, au format 5:4 (1200 × 960). Source : la planche produit LIGNE ROUGE fournie par l'équipe (rendus
studio avec la plaque ovale « Fabriqué en France ») ; on recadre le pot et on complète le fond noir jusqu'au 5:4.
Noter la source de chaque fichier dans `public/photos/CREDITS.md`. Aucun logo de marque concurrente.
Le composant `Photo` n'affiche rien si le fichier manque.

## 3. Seed SQL
Créer une migration `supabase/migrations/NNN_add_<slug>.sql` (skill `supabase-migrations`) :
```sql
with p as (
  insert into public.products (ref, name, slug, category_id, vehicle_type, description, material, usage,
    db_level, hp_gain, torque_gain, weight_saving_kg, install_minutes, price, promo_price, stock)
  values ('LR-XX-07', 'NOM', 'nom', (select id from public.categories where name = 'Ligne complète'),
    'voiture', '3–4 phrases : son, matériaux, sensations.', 'titane', 'route', 95, 10, 15, 5.0, 120, 1990, null, 8)
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, stock)
select id, v.c, v.h, v.s from p, (values ('Titane brut', '#B8B5AE', 4), ('Noir mat', '#1A1A1A', 4)) v(c, h, s);
```
Puis `product_images` (positions 0 = 3/4, 1 = profil, 2 = monté) et `product_compatibility` en joignant `vehicle_models` par `name` + `generation` (ajouter le modèle dans `vehicle_models` s'il manque).

Le `stock` du produit = somme des stocks des variantes.

## 4. Vérifier
- `/boutique` : la carte apparaît avec le bon badge et filtre.
- `/produit/<slug>` : jauges, compatibilité, avertissement circuit.
- Configurateur : saisir un véhicule compatible → le produit est proposé (et jamais en usage route s'il est circuit).
- Commit : `feat(catalogue): ajout <NOM>`.
