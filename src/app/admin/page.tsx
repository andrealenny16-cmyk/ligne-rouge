import type { Metadata } from "next";
import Link from "next/link";
import { RevenueChart, TopProductsChart, UsageDonut } from "@/components/admin/Charts";
import KpiCard from "@/components/admin/KpiCard";
import { formatNumber, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard admin" };

/* KPI : vues SQL kpi_* (security_invoker + is_admin()) — voir .claude/skills/kpi-dashboard */
export default async function AdminDashboard() {
  const supabase = await createClient();
  const [overview, byDay, top, usage, vehicles, lowStock, lastOrders, statuses, sold, reviews, favs, demand] = await Promise.all([
    supabase.from("kpi_overview").select("*").single(),
    supabase.from("kpi_revenue_by_day").select("*"),
    supabase.from("kpi_top_products").select("*"),
    supabase.from("kpi_route_vs_circuit").select("*"),
    supabase.from("kpi_top_vehicles").select("*"),
    supabase.from("kpi_low_stock").select("*"),
    supabase.from("orders").select("id, total, status, created_at, profiles(full_name, email)").order("created_at", { ascending: false }).limit(5),
    supabase.from("orders").select("status"),
    supabase.from("order_items").select("unit_price, quantity, products(vehicle_type), orders!inner(status)").neq("orders.status", "annulee"),
    supabase.from("reviews").select("rating"),
    supabase.from("favorites").select("product_id", { count: "exact", head: true }),
    supabase.from("kpi_stock_demand").select("*"),
  ]);

  // Statuts des commandes (pipeline logistique)
  const STATUS: [string, string, string][] = [
    ["payee", "Payées", "bg-bronze"],
    ["preparation", "En préparation", "bg-amber-500"],
    ["expediee", "Expédiées", "bg-blue-500"],
    ["livree", "Livrées", "bg-emerald-500"],
    ["annulee", "Annulées", "bg-alert"],
  ];
  const statusCount = (k: string) => (statuses.data ?? []).filter((o) => o.status === k).length;
  const totalOrders = statuses.data?.length || 1;
  // CA voiture vs moto (lignes de commande non annulées)
  const byType = { voiture: 0, moto: 0 };
  for (const it of (sold.data ?? []) as unknown as { unit_price: number; quantity: number; products: { vehicle_type: "voiture" | "moto" } | null }[]) {
    if (it.products) byType[it.products.vehicle_type] += Number(it.unit_price) * it.quantity;
  }
  const typeTotal = byType.voiture + byType.moto || 1;
  const ratings = (reviews.data ?? []).map((r) => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const cancelRate = (statusCount("annulee") / totalOrders) * 100;

  const k = overview.data ?? { revenue: 0, orders_count: 0, avg_basket: 0, customers: 0, conversion_rate: 0, open_carts: 0, open_carts_value: 0 };
  const last30 = (byDay.data ?? []).reduce((s, d) => s + Number(d.revenue), 0);
  const topVehicles = [...(vehicles.data ?? [])]
    .map((v) => ({ ...v, score: Number(v.garage_count) * 3 + Number(v.search_count) + Number(v.compat_checks) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const maxScore = topVehicles[0]?.score || 1;
  const demandRows = demand.data ?? [];
  const waitingTotal = demandRows.reduce((s, d) => s + Number(d.waiting), 0);
  const notifiedTotal = demandRows.reduce((s, d) => s + Number(d.notified), 0);
  const maxWaiting = Math.max(1, ...demandRows.map((d) => Number(d.waiting)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="col-span-2">
          <KpiCard accent label="Chiffre d'affaires total" value={formatPrice(k.revenue)} sub={`${formatPrice(last30)} sur les 30 derniers jours`} />
        </div>
        <KpiCard label="Commandes" value={formatNumber(k.orders_count)} sub="hors annulées" />
        <KpiCard label="Panier moyen" value={formatPrice(k.avg_basket)} />
        <KpiCard label="Clients" value={formatNumber(k.customers)} />
        <KpiCard label="Conversion" value={`${formatNumber(k.conversion_rate ?? 0)} %`} sub="commandes / vues produit" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl uppercase">CA · 30 jours</h2>
            <span className="font-mono text-xs text-neutral-400">kpi_revenue_by_day</span>
          </div>
          <RevenueChart data={byDay.data ?? []} />
        </section>
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-4 font-display text-2xl uppercase">Route vs circuit</h2>
          <UsageDonut data={usage.data ?? []} />
          <div className="cote my-5" />
          <p className="label">Paniers en cours</p>
          <p className="font-display text-3xl">
            {k.open_carts} <span className="text-base text-neutral-500">· {formatPrice(k.open_carts_value)} en attente</span>
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass rounded-3xl p-5 lg:col-span-1">
          <h2 className="mb-3 font-display text-2xl uppercase">Top produits</h2>
          <TopProductsChart data={top.data ?? []} />
        </section>
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-1 font-display text-2xl uppercase">Véhicules demandés</h2>
          <p className="mb-4 text-xs text-neutral-400">Garages, configurateur et vérifications de compatibilité</p>
          <ul className="space-y-3">
            {topVehicles.map((v) => (
              <li key={v.model_id}>
                <div className="flex justify-between text-sm">
                  <span>{v.vehicle}</span>
                  <span className="font-mono text-xs text-neutral-500">
                    {v.garage_count} gar. · {v.search_count} IA · {v.compat_checks} compat.
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-black/[0.04]">
                  <div className="bg-heat h-full rounded-full" style={{ width: `${(v.score / maxScore) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-4 font-display text-2xl uppercase">
            Stock bas <span className="text-alert">≤ 3</span>
          </h2>
          {lowStock.data?.length ? (
            <ul className="space-y-2">
              {lowStock.data.map((s) => (
                <li key={s.variant_id} className="flex items-center justify-between rounded-2xl border border-alert/25 bg-alert/5 px-4 py-2.5 text-sm">
                  <span>
                    {s.name} <span className="text-neutral-500">· {s.color_name}</span>
                  </span>
                  <span className={`font-mono font-bold ${s.stock === 0 ? "text-alert" : "text-alert"}`}>{s.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Aucune alerte.</p>
          )}
          <Link href="/admin/produits" className="mt-4 inline-block text-sm text-bronze underline">Gérer les stocks →</Link>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-4 font-display text-2xl uppercase">Pipeline commandes</h2>
          <div className="flex h-3 overflow-hidden rounded-full">
            {STATUS.map(([k, , c]) => (
              <div key={k} className={c} style={{ width: `${(statusCount(k) / totalOrders) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {STATUS.map(([k, label, c]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${c}`} />{label}</span>
                <span className="font-mono">{statusCount(k)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">Taux d&apos;annulation : {formatNumber(Math.round(cancelRate * 10) / 10)} %</p>
        </section>
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-4 font-display text-2xl uppercase">Voiture vs moto</h2>
          {(["voiture", "moto"] as const).map((t) => (
            <div key={t} className="mb-4">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{t}</span>
                <span className="font-semibold">{formatPrice(byType[t])} · {Math.round((byType[t] / typeTotal) * 100)} %</span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-black/[0.05]">
                <div className={`h-full rounded-full ${t === "voiture" ? "bg-heat" : "bg-bronze"}`} style={{ width: `${(byType[t] / typeTotal) * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="text-xs text-neutral-500">Chiffre d&apos;affaires des lignes de commande non annulées</p>
        </section>
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-4 font-display text-2xl uppercase">Satisfaction</h2>
          <p className="font-display text-6xl leading-none">{avgRating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}<span className="text-2xl text-neutral-400"> / 5</span></p>
          <p className="mt-1 text-sm text-neutral-500">{ratings.length} avis clients</p>
          <ul className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = ratings.filter((r) => r === n).length;
              return (
                <li key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-6 font-mono">{n}★</span>
                  <div className="h-2 flex-1 rounded-full bg-black/[0.05]">
                    <div className="h-full rounded-full bg-bronze" style={{ width: `${ratings.length ? (c / ratings.length) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-right font-mono">{c}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">{favs.count ?? 0} produits mis en favoris</p>
        </section>
      </div>

      <section className="glass rounded-3xl p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl uppercase">
            Demande en <span className="text-alert">rupture</span>
          </h2>
          <span className="font-mono text-xs text-neutral-400">kpi_stock_demand</span>
        </div>
        <p className="mb-4 text-xs text-neutral-400">
          Clients abonnés à « Me prévenir du retour » · <span className="font-semibold text-night">{formatNumber(waitingTotal)} en attente</span> · {formatNumber(notifiedTotal)} prévenus après réassort
        </p>
        {demandRows.length ? (
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
            {demandRows.map((d) => (
              <li key={d.variant_id}>
                <div className="flex justify-between gap-3 text-sm">
                  <span>
                    {d.name} <span className="text-neutral-500">· {d.color_name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-neutral-500">
                    <span className="font-bold text-alert">{d.waiting}</span> en attente · stock {d.stock}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-black/[0.04]">
                  <div className="bg-heat h-full rounded-full" style={{ width: `${(Number(d.waiting) / maxWaiting) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Aucune alerte client pour l&apos;instant.</p>
        )}
      </section>

      <section className="glass rounded-3xl p-5">
        <div className="mb-3 flex justify-between">
          <h2 className="font-display text-2xl uppercase">Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-sm text-bronze underline">Tout voir</Link>
        </div>
        <ul className="divide-y divide-black/10 text-sm">
          {(lastOrders.data ?? []).map((o) => {
            const c = o.profiles as unknown as { full_name: string | null; email: string } | null;
            return (
              <li key={o.id} className="flex justify-between py-2.5">
                <span>
                  <span className="font-mono text-xs text-neutral-400">{o.id.slice(0, 8).toUpperCase()}</span> · {c?.full_name ?? c?.email}
                </span>
                <span className="font-semibold">{formatPrice(o.total, true)}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
