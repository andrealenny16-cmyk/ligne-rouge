import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Page, PillLink } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Commande confirmée" };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser("/compte");
  // RLS : seul le propriétaire (ou un admin) peut lire la commande
  const { data: order } = await supabase
    .from("orders")
    .select("id, total, discount, shipping, created_at, address_snapshot, order_items(product_name, color_name, quantity, unit_price)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();
  const addr = order.address_snapshot as { line1: string; zip: string; city: string };

  return (
    <Page className="max-w-3xl text-center">
      <div className="bg-heat mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl">✓</div>
      <p className="label mt-6">Commande n° {order.id.slice(0, 8).toUpperCase()}</p>
      <h1 className="font-display font-semibold text-5xl uppercase leading-none md:text-7xl">
        Ça va <span className="text-rouge">rugir</span>
      </h1>
      <p className="mt-4 text-neutral-600">
        Paiement accepté. Expédition sous 48 h vers {addr.line1}, {addr.zip} {addr.city}.
      </p>
      <div className="glass mx-auto mt-8 max-w-md space-y-2 rounded-md p-6 text-left text-sm">
        {order.order_items.map((i, k) => (
          <div key={k} className="flex justify-between">
            <span>{i.quantity} × {i.product_name} · {i.color_name}</span>
            <span>{formatPrice(i.unit_price * i.quantity)}</span>
          </div>
        ))}
        <div className="cote my-3" />
        <div className="flex justify-between text-lg font-semibold">
          <span>Total payé</span>
          <span className="text-rouge">{formatPrice(order.total, true)}</span>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <PillLink href="/compte">Suivre ma commande</PillLink>
        <PillLink href="/boutique" plus={false} className="!pr-6">Continuer mes achats</PillLink>
      </div>
    </Page>
  );
}
