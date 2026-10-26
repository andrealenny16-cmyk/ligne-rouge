"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/actions";
import { PillButton } from "@/components/ui";

type Address = { id: string; label: string; line1: string; city: string; zip: string; country: string; is_default: boolean };

export default function CheckoutForm({ addresses, promo, circuitAck, total }: { addresses: Address[]; promo: string; circuitAck: boolean; total: string }) {
  const [state, action, pending] = useActionState(placeOrder, null);

  return (
    <form action={action} className="space-y-6">
      {addresses.length > 0 && (
        <fieldset className="glass space-y-2 rounded-3xl p-6">
          <legend className="sr-only">Adresse</legend>
          <p className="label">Livrer à</p>
          {addresses.map((a) => (
            <label key={a.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 has-[:checked]:border-bronze has-[:checked]:bg-bronze/5">
              <input type="radio" name="address_id" value={a.id} defaultChecked={a.is_default} required className="mt-1 accent-[#E8A36B]" />
              <span className="text-sm">
                <span className="font-semibold">{a.label}</span>
                <br />
                <span className="text-white/65">
                  {a.line1}, {a.zip} {a.city}, {a.country}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <input type="hidden" name="promo" value={promo} />
      {circuitAck && <input type="hidden" name="circuit_ack" value="on" />}

      <section className="glass rounded-3xl p-6">
        <p className="font-display text-2xl uppercase">2. Paiement</p>
        <p className="mt-2 text-sm text-white/60">Paiement simulé pour la démonstration : aucune carte n&apos;est demandée ni débitée.</p>
        <div className="carbon mt-4 flex items-center justify-between rounded-2xl border border-white/10 p-5">
          <span className="font-mono text-sm tracking-widest text-white/70">CARTE DÉMO •••• 0000</span>
          <span className="font-display text-xl">LIGNE ROUGE PAY</span>
        </div>
        {state && !state.ok && <p role="alert" className="mt-4 rounded-2xl bg-alert/15 p-3 text-sm text-[#ff8a92]">{state.error}</p>}
        <PillButton variant="heat" type="submit" disabled={pending || !addresses.length} className="mt-5 w-full justify-between">
          {pending ? "Paiement en cours…" : `Payer ${total}`}
        </PillButton>
        {!addresses.length && <p className="mt-2 text-xs text-white/45">Ajoute d&apos;abord une adresse ci-dessus.</p>}
      </section>
    </form>
  );
}
