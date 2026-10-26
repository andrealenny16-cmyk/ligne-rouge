import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appelé depuis un Server Component : le middleware rafraîchit la session.
          }
        },
      },
    },
  );
}

/** Utilisateur courant + profil, mémoïsé pour la requête. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile };
});

export async function requireUser(next = "/compte") {
  const session = await getSession();
  if (!session.user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return session as typeof session & { user: NonNullable<typeof session.user> };
}

/** Deuxième barrière après le middleware : vérification serveur du rôle admin. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.user) redirect("/connexion?next=/admin");
  if (session.profile?.role !== "admin") redirect("/?refus=admin");
  return session;
}
