import type { Metadata } from "next";
import Link from "next/link";
import StatusSelect from "@/components/admin/StatusSelect";
import { formatDate, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Commandes · Admin" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("orders")
    .select("id, status, total, created_at, promo_code, address_snapshot, profiles(full_name, email), order_items(product_name, color_name, quantity)")
    .order("created_at", { ascending: false });
  if (statut && statut in ORDER_STATUS_LABEL) q = q.eq("status", statut);
  const { data: orders } = await q;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {[["", "Toutes"], ...Object.entries(ORDER_STATUS_LABEL)].map(([k, label]) => (
          <Link
            key={k}
            href={k ? `/admin/commandes?statut=${k}` : "/admin/commandes"}
            className={`rounded-md border px-4 py-2 text-sm ${(statut ?? "") === k ? "border-rouge bg-rouge text-white font-semibold" : "border-neutral-300 text-neutral-700 hover:border-neutral-400"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="glass overflow-x-auto rounded-md">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="font-mono text-[0.65rem] uppercase tracking-wider text-neutral-400">
            <tr className="border-b border-line">
              <th className="p-4">Commande</th>
              <th className="p-4">Client</th>
              <th className="p-4">Articles</th>
              <th className="p-4">Total</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => {
              const c = o.profiles as unknown as { full_name: string | null; email: string } | null;
              const a = o.address_snapshot as { city: string };
              return (
                <tr key={o.id} className="border-b border-line align-top">
                  <td className="p-4">
                    <p className="font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-neutral-400">{formatDate(o.created_at)}</p>
                  </td>
                  <td className="p-4">
                    <p>{c?.full_name ?? "—"}</p>
                    <p className="text-xs text-neutral-400">{c?.email} · {a?.city}</p>
                  </td>
                  <td className="p-4 text-neutral-700">
                    {o.order_items.map((i, k) => (
                      <p key={k}>{i.quantity} × {i.product_name} <span className="text-neutral-400">({i.color_name})</span></p>
                    ))}
                  </td>
                  <td className="p-4 font-semibold">
                    {formatPrice(o.total, true)}
                    {o.promo_code && <p className="font-mono text-[0.65rem] text-legal">{o.promo_code}</p>}
                  </td>
                  <td className="p-4">
                    <StatusSelect orderId={o.id} status={o.status as OrderStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!orders?.length && <p className="p-6 text-neutral-500">Aucune commande.</p>}
      </div>
    </div>
  );
}
