import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Deuxième barrière (après le middleware) : vérification serveur du rôle
  const { profile } = await requireAdmin();
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-8 md:pt-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label">Espace administrateur · {profile?.email}</p>
          <h1 className="font-display font-semibold text-5xl uppercase leading-none md:text-6xl">
            Poste de <span className="text-rouge">pilotage</span>
          </h1>
        </div>
        <nav className="glass flex gap-1 rounded-full p-1.5 text-sm font-semibold">
          {[
            ["/admin", "Dashboard"],
            ["/admin/commandes", "Commandes"],
            ["/admin/produits", "Produits"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-4 py-2 text-neutral-700 hover:bg-rouge hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </main>
  );
}
