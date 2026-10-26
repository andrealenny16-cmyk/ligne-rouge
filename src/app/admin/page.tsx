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
  const [overview, byDay, top, usage, vehicles, lowStock, lastOrders] = await Promise.all([
    supabase.from("kpi_overview").select("*").single(),
    supabase.from("kpi_revenue_by_day").select("*"),
    supabase.from("kpi_top_products").select("*"),
    supabase.from("kpi_route_vs_circuit").select("*"),
    supabase.from("kpi_top_vehicles").select("*"),
    supabase.from("kpi_low_stock").select("*"),
    supabase.from("orders").select("id, total, status, created_at, profiles(full_name, email)").order("created_at", { ascending: false }).limit(5),
  ]);

  const k = overview.data ?? { revenue: 0, orders_count: 0, avg_basket: 0, customers: 0, conversion_rate: 0, open_carts: 0, open_carts_value: 0 };
  const last30 = (byDay.data ?? []).reduce((s, d) => s + Number(d.revenue), 0);
  const topVehicles = [...(vehicles.data ?? [])]
    .map((v) => ({ ...v, score: Number(v.garage_count) * 3 + Number(v.search_count) + Number(v.compat_checks) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const maxScore = topVehicles[0]?.score || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="col-span-2">
          <KpiCard accent label="Chiffre d'affaires total" value={formatPrice(k.revenue)} sub={`${formatPrice(last30)} sur les 30 derniers jours`} />
        </div>
        <KpiCard label="Commandes" value={formatNumber(k.orders_count)} sub="hors annulées" />
        <KpiCard label="Panier moyen" value={formatPrice(k.avg_basket)} />
        <KpiCard label="Clients" value={formatNumber(k.customers)} />
        <KpiCard label="Conversion" value={`${k.conversion_rate ?? 0} %`} sub="commandes / vues produit" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl uppercase">CA · 30 jours</h2>
            <span className="font-mono text-xs text-white/45">kpi_revenue_by_day</span>
          </div>
          <RevenueChart data={byDay.data ?? []} />
        </section>
        <section className="glass rounded-3xl p-5">
          <h2 className="mb-4 font-display text-2xl uppercase">Route vs circuit</h2>
          <UsageDonut data={usage.data ?? []} />
          <div className="cote my-5" />
          <p className="label">Paniers en cours</p>
          <p className="font-display text-3xl">
            {k.open_carts} <span className="text-base text-white/50">· {formatPrice(k.open_carts_value)} en attente</span>
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
          <p className="mb-4 text-xs text-white/45">Garages, configurateur et vérifications de compatibilité</p>
          <ul className="space-y-3">
            {topVehicles.map((v) => (
              <li key={v.model_id}>
                <div className="flex justify-between text-sm">
                  <span>{v.vehicle}</span>
                  <span className="font-mono text-xs text-white/50">
                    {v.garage_count} gar. · {v.search_count} IA · {v.compat_checks} compat.
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10">
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
                    {s.name} <span className="text-white/50">· {s.color_name}</span>
                  </span>
                  <span className={`font-mono font-bold ${s.stock === 0 ? "text-alert" : "text-[#ff9aa2]"}`}>{s.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/55">Aucune alerte.</p>
          )}
          <Link href="/admin/produits" className="mt-4 inline-block text-sm text-bronze underline">Gérer les stocks →</Link>
        </section>
      </div>

      <section className="glass rounded-3xl p-5">
        <div className="mb-3 flex justify-between">
          <h2 className="font-display text-2xl uppercase">Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-sm text-bronze underline">Tout voir</Link>
        </div>
        <ul className="divide-y divide-white/10 text-sm">
          {(lastOrders.data ?? []).map((o) => {
            const c = o.profiles as unknown as { full_name: string | null; email: string } | null;
            return (
              <li key={o.id} className="flex justify-between py-2.5">
                <span>
                  <span className="font-mono text-xs text-white/45">{o.id.slice(0, 8).toUpperCase()}</span> · {c?.full_name ?? c?.email}
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
