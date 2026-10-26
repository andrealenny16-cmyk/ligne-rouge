"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkPromo, removeCartItem, updateCartItem } from "@/app/actions";
import { CircuitWarning, PillButton, UsageBadge } from "@/components/ui";
import { SHIPPING_FREE_FROM, totals, type CartLine } from "@/lib/cart";
import { finalPrice, formatPrice } from "@/lib/format";

export default function CartView({ lines, subtotal, hasCircuit }: { lines: CartLine[]; subtotal: number; hasCircuit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [ack, setAck] = useState(false);
  const t = totals(subtotal, promo?.percent ?? 0);

  const apply = () =>
    start(async () => {
      setPromoError("");
      const r = await checkPromo(code);
      if ("error" in r) {
        setPromo(null);
        setPromoError(r.error);
      } else setPromo({ code: code.trim().toUpperCase(), percent: r.percent });
    });

  const goCheckout = () => {
    const qs = new URLSearchParams();
    if (promo) qs.set("promo", promo.code);
    if (hasCircuit) qs.set("ack", "1");
    router.push(`/commande?${qs}`);
  };

  return (
    <div className={`grid gap-8 lg:grid-cols-[1fr_380px] ${pending ? "opacity-80" : ""}`}>
      <ul className="space-y-3">
        {lines.map((l) => (
          <li key={l.id} className="glass flex gap-4 rounded-md p-3 md:items-center md:p-4">
            <Link href={`/produit/${l.product.slug}`} className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-paper md:w-36">
              <Image src={`/products/${l.product.slug}-34.svg`} alt={l.product.name} fill sizes="144px" className="object-contain" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-semibold text-2xl uppercase leading-none">{l.product.name}</span>
                  <UsageBadge usage={l.product.usage} />
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
                  <span className="h-3 w-3 rounded-full border border-neutral-400" style={{ background: l.variant.color_hex }} /> {l.variant.color_name}
                  <span className="font-mono text-xs text-neutral-400">· {l.product.ref}</span>
                </p>
              </div>
              <div className="flex items-center justify-between gap-5">
                <div className="flex items-center rounded-full border border-neutral-300">
                  <button aria-label="Diminuer" onClick={() => start(() => updateCartItem(l.id, l.quantity - 1))} className="h-9 w-9 text-lg">−</button>
                  <span className="w-6 text-center font-mono">{l.quantity}</span>
                  <button
                    aria-label="Augmenter"
                    disabled={l.quantity >= Math.min(10, l.variant.stock)}
                    onClick={() => start(() => updateCartItem(l.id, l.quantity + 1))}
                    className="h-9 w-9 text-lg disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <span className="w-24 text-right font-semibold text-rouge">{formatPrice(finalPrice(l.product) * l.quantity)}</span>
                <button aria-label={`Retirer ${l.product.name}`} onClick={() => start(() => removeCartItem(l.id))} className="text-neutral-400 hover:text-alert">
                  ✕
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="glass h-fit space-y-4 rounded-md p-6 lg:sticky lg:top-28">
        <p className="font-display font-semibold text-3xl uppercase">Récapitulatif</p>
        <div>
          <span className="label">Code promo</span>
          <div className="flex gap-2">
            <input className="field uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ROUGE10" />
            <button onClick={apply} disabled={!code.trim()} className="rounded-md bg-cream px-4 font-semibold disabled:opacity-40">
              OK
            </button>
          </div>
          {promoError && <p className="mt-1 text-xs text-rouge">{promoError}</p>}
          {promo && <p className="mt-1 text-xs text-legal">{promo.code} appliqué : −{promo.percent} %</p>}
        </div>
        <div className="cote" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-neutral-600">Sous-total</dt><dd>{formatPrice(subtotal, true)}</dd></div>
          {t.discount > 0 && <div className="flex justify-between text-legal"><dt>Remise</dt><dd>−{formatPrice(t.discount, true)}</dd></div>}
          <div className="flex justify-between">
            <dt className="text-neutral-600">Livraison</dt>
            <dd>{t.shipping ? formatPrice(t.shipping, true) : "Offerte"}</dd>
          </div>
          {t.shipping > 0 && <p className="text-xs text-neutral-400">Offerte dès {SHIPPING_FREE_FROM} €</p>}
          <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total TTC</dt><dd className="text-rouge">{formatPrice(t.total, true)}</dd></div>
        </dl>
        {hasCircuit && (
          <>
            <CircuitWarning />
            <label className="flex cursor-pointer gap-3 text-sm">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#C8102E]" />
              <span>Je reconnais que les produits « Circuit » de mon panier sont destinés à un usage exclusif sur circuit fermé.</span>
            </label>
          </>
        )}
        <PillButton variant="heat" className="w-full justify-between" onClick={goCheckout} disabled={hasCircuit && !ack}>
          Passer commande
        </PillButton>
      </aside>
    </div>
  );
}
