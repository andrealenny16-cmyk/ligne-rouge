-- Inscription sans vérification par email : chaque nouveau compte est confirmé dès sa création,
-- le client est connecté tout de suite après l'inscription (src/components/AuthForm.tsx).

create or replace function public.auto_confirm_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_email();

-- Comptes déjà créés en attente de confirmation
update auth.users set email_confirmed_at = now() where email_confirmed_at is null;

revoke execute on function public.auto_confirm_email() from public, anon, authenticated;
