import type { Metadata } from "next";
import Link from "next/link";
import { deleteAddress, deleteGarageVehicle, signOut } from "@/app/actions";
import AddressForm from "@/components/account/AddressForm";
import GarageForm from "@/components/account/GarageForm";
import ProductCard from "@/components/ProductCard";
import { Page, UsageBadge } from "@/components/ui";
import { getVehicles } from "@/lib/catalog";
import { formatDate, formatPrice } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL, PRODUCT_SELECT, type OrderStatus, type Product, type Usage } from "@/lib/types";

export const metadata: Metadata = { title: "Mon compte" };

const STATUS_STEPS: OrderStatus[] = ["payee", "preparation", "expediee", "livree"];

type GarageRow = {
  id: string;
  year: number;
  nickname: string | null;
  vehicle_models: {
    id: number;
    name: string;
    generation: string | null;
    vehicle_makes: { name: string; type: string };
    product_compatibility: { products: { name: string; slug: string; usage: Usage; is_active: boolean } }[];
  };
};

export default async function ComptePage() {
  const { supabase, user, profile } = await requireUser("/compte");
  const [{ data: orders }, { data: garage }, { data: favs }, { data: addresses }, vehicles] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total, created_at, order_items(product_name, color_name, quantity)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("garage_vehicles")
      .select("id, year, nickname, vehicle_models(id, name, generation, vehicle_makes(name, type), product_compatibility(products(name, slug, usage, is_active)))")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase.from("favorites").select(`products(${PRODUCT_SELECT})`).eq("user_id", user.id),
    supabase.from("addresses").select("id, label, line1, city, zip, country, is_default").eq("user_id", user.id).order("created_at"),
    getVehicles(),
  ]);

  const favorites = ((favs ?? []) as unknown as { products: Product }[]).map((f) => f.products).filter(Boolean);
  const firstName = profile?.full_name?.split(" ")[0] ?? user.email;

  return (
    <Page>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Espace client</p>
          <h1 className="font-display text-5xl uppercase leading-[0.9] md:text-7xl">
            Salut <span className="text-bronze">{firstName}</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {profile?.role === "admin" && (
            <Link href="/admin" className="rounded-full bg-bronze px-5 py-2.5 text-sm font-bold text-ink">Dashboard admin</Link>
          )}
          <form action={signOut}>
            <button className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold hover:border-alert/60">Déconnexion</button>
          </form>
        </div>
      </div>

      {/* Commandes */}
      <section className="mb-14">
        <h2 className="mb-4 font-display text-3xl uppercase">Mes commandes</h2>
        {orders?.length ? (
          <ul className="space-y-3">
            {orders.map((o) => {
              const step = STATUS_STEPS.indexOf(o.status as OrderStatus);
              return (
                <li key={o.id} className="glass rounded-3xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-white/45">N° {o.id.slice(0, 8).toUpperCase()} · {formatDate(o.created_at)}</p>
                      <p className="mt-1 text-sm">
                        {o.order_items.map((i) => `${i.quantity} × ${i.product_name} (${i.color_name})`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${o.status === "annulee" ? "text-[#ff7a84]" : "text-bronze"}`}>{ORDER_STATUS_LABEL[o.status as OrderStatus]}</p>
                      <p className="font-bold">{formatPrice(o.total, true)}</p>
                    </div>
                  </div>
                  {o.status !== "annulee" && (
                    <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden>
                      {STATUS_STEPS.map((s, i) => (
                        <div key={s}>
                          <div className={`h-1.5 rounded-full ${i <= step ? "bg-heat" : "bg-white/10"}`} />
                          <p className="mt-1 hidden text-[0.65rem] text-white/45 sm:block">{ORDER_STATUS_LABEL[s]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="glass rounded-3xl p-6 text-white/60">Aucune commande pour l&apos;instant. <Link href="/boutique" className="text-bronze underline">Découvrir la gamme</Link></p>
        )}
      </section>

      {/* Garage */}
      <section className="mb-14">
        <h2 className="font-display text-3xl uppercase">Mon <span className="text-heat">garage</span></h2>
        <p className="mb-4 text-sm text-white/55">Enregistre tes véhicules : on te montre les pots compatibles et on pré-remplit les vérifications.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {((garage ?? []) as unknown as GarageRow[]).map((g) => {
            const pots = g.vehicle_models.product_compatibility.map((c) => c.products).filter((p) => p?.is_active);
            return (
              <div key={g.id} className="carbon rounded-3xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {g.nickname && <p className="font-mono text-xs text-bronze">« {g.nickname} »</p>}
                    <p className="font-display text-3xl uppercase leading-none">
                      {g.vehicle_models.vehicle_makes.name} {g.vehicle_models.name}
                    </p>
                    <p className="font-mono text-xs text-white/45">{g.vehicle_models.generation} · {g.year} · {g.vehicle_models.vehicle_makes.type}</p>
                  </div>
                  <form action={deleteGarageVehicle.bind(null, g.id)}>
                    <button aria-label="Retirer du garage" className="text-white/40 hover:text-alert">✕</button>
                  </form>
                </div>
                <div className="cote my-4" />
                <p className="label">Pots compatibles</p>
                {pots.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {pots.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/produit/${p.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 py-1 pl-3 pr-1 text-sm hover:border-bronze/60">
                          {p.name} <UsageBadge usage={p.usage} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/50">Pas encore de pot pour ce modèle. <Link href="/configurateur" className="text-bronze underline">Demander au configurateur</Link></p>
                )}
              </div>
            );
          })}
        </div>
        <div className="glass mt-4 rounded-3xl p-5">
          <p className="label">Ajouter un véhicule</p>
          <GarageForm makes={vehicles.makes} models={vehicles.models} />
        </div>
      </section>

      {/* Favoris */}
      <section className="mb-14">
        <h2 className="mb-4 font-display text-3xl uppercase">Mes favoris</h2>
        {favorites.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-sm text-white/55">Clique sur le ♥ d&apos;une fiche produit pour la retrouver ici.</p>
        )}
      </section>

      {/* Adresses */}
      <section>
        <h2 className="mb-4 font-display text-3xl uppercase">Mes adresses</h2>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {(addresses ?? []).map((a) => (
            <div key={a.id} className="glass flex items-start justify-between rounded-3xl p-5 text-sm">
              <div>
                <p className="font-semibold">{a.label} {a.is_default && <span className="ml-1 font-mono text-[0.65rem] text-bronze">PAR DÉFAUT</span>}</p>
                <p className="text-white/65">{a.line1}<br />{a.zip} {a.city}, {a.country}</p>
              </div>
              <form action={deleteAddress.bind(null, a.id)}>
                <button aria-label="Supprimer l'adresse" className="text-white/40 hover:text-alert">✕</button>
              </form>
            </div>
          ))}
        </div>
        <div className="glass rounded-3xl p-5">
          <AddressForm compact={!!addresses?.length} />
        </div>
      </section>
    </Page>
  );
}
