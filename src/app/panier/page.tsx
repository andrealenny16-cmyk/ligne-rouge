import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";
import { Page, PageTitle, PillLink } from "@/components/ui";
import { getCart } from "@/lib/cart";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Panier" };

export default async function PanierPage() {
  const { supabase, user } = await requireUser("/panier");
  const cart = await getCart(supabase, user.id);

  return (
    <Page>
      <PageTitle kicker="Sauvegardé sur ton compte" title="Ton" accent="panier" />
      {cart.lines.length ? (
        <CartView lines={cart.lines} subtotal={cart.subtotal} hasCircuit={cart.hasCircuit} />
      ) : (
        <div className="glass rounded-md p-10 text-center">
          <p className="font-display font-semibold text-4xl uppercase">Silence radio</p>
          <p className="mb-6 mt-2 text-neutral-600">Ton panier est vide. Il est temps de faire du bruit.</p>
          <PillLink href="/boutique" className="mx-auto">Voir la boutique</PillLink>
        </div>
      )}
    </Page>
  );
}
