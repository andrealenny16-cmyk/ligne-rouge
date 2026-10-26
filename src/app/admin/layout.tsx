import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Deuxième barrière (après le middleware) : vérification serveur du rôle
  const { profile } = await requireAdmin();
  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-28 md:px-8 md:pt-36">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label">Espace administrateur · {profile?.email}</p>
          <h1 className="font-display text-5xl uppercase leading-none md:text-6xl">
            Poste de <span className="text-bronze">pilotage</span>
          </h1>
        </div>
        <nav className="glass flex gap-1 rounded-full p-1.5 text-sm font-semibold">
          {[
            ["/admin", "Dashboard"],
            ["/admin/commandes", "Commandes"],
            ["/admin/produits", "Produits"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full px-4 py-2 text-white/75 hover:bg-bronze hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </main>
  );
}
