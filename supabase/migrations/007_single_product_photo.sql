-- Une seule photo par produit : la plus nette, issue de la planche produit LIGNE ROUGE.
-- On ne garde que l'image principale (position 0, /photos/<slug>-34.jpg).

delete from public.product_images where position > 0;

update public.product_images i
   set url = '/photos/' || p.slug || '-34.jpg',
       alt = p.name || ', échappement LIGNE ROUGE'
  from public.products p
 where p.id = i.product_id and i.position = 0;
