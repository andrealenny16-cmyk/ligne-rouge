import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AddressForm from "@/components/account/AddressForm";
import CheckoutForm from "@/components/cart/CheckoutForm";
import { Page, PageTitle } from "@/components/ui";
import { getCart, totals } from "@/lib/cart";
import { finalPrice, formatPrice } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Commande" };

export default async function CommandePage({ searchParams }: { searchParams: Promise<{ promo?: string; ack?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser("/commande");
  const cart = await getCart(supabase, user.id);
  if (!cart.lines.length) redirect("/panier");
  if (cart.hasCircuit && sp.ack !== "1") redirect("/panier");

  const [{ data: addresses }, promo] = await Promise.all([
    supabase.from("addresses").select("id, label, line1, city, zip, country, is_default").eq("user_id", user.id).order("is_default", { ascending: false }),
    sp.promo ? supabase.rpc("validate_promo", { p_code: sp.promo }) : Promise.resolve({ data: null }),
  ]);
  const percent = (promo.data as number | null) ?? 0;
  const t = totals(cart.subtotal, percent);

  return (
    <Page>
      <PageTitle kicker="Étape finale" title="Livraison &" accent="paiement" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="glass rounded-3xl p-6">
            <p className="font-display text-2xl uppercase">1. Adresse de livraison</p>
            {addresses?.length ? null : <p className="mt-2 text-sm text-neutral-600">Ajoute ta première adresse.</p>}
            <div className="mt-4">
              <AddressForm compact />
            </div>
          </section>
          <CheckoutForm
            addresses={addresses ?? []}
            promo={percent ? sp.promo!.toUpperCase() : ""}
            circuitAck={cart.hasCircuit}
            total={formatPrice(t.total, true)}
          />
        </div>

        <aside className="glass h-fit space-y-3 rounded-3xl p-6">
          <p className="font-display text-2xl uppercase">Ta commande</p>
          {cart.lines.map((l) => (
            <div key={l.id} className="flex justify-between gap-3 text-sm">
              <span>
                {l.quantity} × {l.product.name} <span className="text-neutral-400">· {l.variant.color_name}</span>
              </span>
              <span>{formatPrice(finalPrice(l.product) * l.quantity)}</span>
            </div>
          ))}
          <div className="cote my-2" />
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-600">Sous-total</dt><dd>{formatPrice(cart.subtotal, true)}</dd></div>
            {t.discount > 0 && <div className="flex justify-between text-legal"><dt>{sp.promo?.toUpperCase()}</dt><dd>−{formatPrice(t.discount, true)}</dd></div>}
            <div className="flex justify-between"><dt className="text-neutral-600">Livraison</dt><dd>{t.shipping ? formatPrice(t.shipping, true) : "Offerte"}</dd></div>
            <div className="flex justify-between pt-1 text-lg font-bold"><dt>Total</dt><dd className="text-bronze">{formatPrice(t.total, true)}</dd></div>
          </dl>
        </aside>
      </div>
    </Page>
  );
}
