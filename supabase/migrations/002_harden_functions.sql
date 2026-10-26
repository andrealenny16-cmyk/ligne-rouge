-- Durcissement suite à get_advisors (security) :
-- les fonctions de trigger ne doivent pas être appelables via /rpc.
-- is_admin() reste exécutable : les policies l'évaluent avec le rôle de l'appelant.
revoke execute on function public.handle_new_user()     from public, anon, authenticated;
revoke execute on function public.prevent_role_change() from public, anon, authenticated;
revoke execute on function public.sync_product_stock()  from public, anon, authenticated;

-- Validation des codes promo réservée aux clients connectés (panier)
revoke execute on function public.validate_promo(text) from public, anon;
grant  execute on function public.validate_promo(text) to authenticated;
