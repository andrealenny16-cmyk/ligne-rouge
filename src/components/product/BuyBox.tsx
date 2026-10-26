"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCart, toggleFavorite, toggleStockAlert } from "@/app/actions";
import { PillButton } from "@/components/ui";
import { discountPercent, finalPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function BuyBox({
  product: p,
  loggedIn,
  isFavorite,
  alertVariantIds = [],
}: {
  product: Product;
  loggedIn: boolean;
  isFavorite: boolean;
  alertVariantIds?: string[];
}) {
  const router = useRouter();
  const variants = p.product_variants ?? [];
  const [variantId, setVariantId] = useState(variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id);
  const [fav, setFav] = useState(isFavorite);
  const [alerts, setAlerts] = useState(() => new Set(alertVariantIds));
  const [msg, setMsg] = useState<{ ok: boolean; text: string; cart?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const variant = variants.find((v) => v.id === variantId);
  const off = discountPercent(p);

  const needLogin = () => router.push(`/connexion?next=/produit/${p.slug}`);

  const add = () =>
    start(async () => {
      if (!variantId) return;
      const r = await addToCart(variantId);
      if (!r.ok && r.error === "auth") return needLogin();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Ajouté", cart: true } : { ok: false, text: r.error });
    });

  const favorite = () =>
    start(async () => {
      const r = await toggleFavorite(p.id);
      if (!r.ok && r.error === "auth") return needLogin();
      setFav((f) => !f);
    });

  const toggleAlert = () =>
    start(async () => {
      if (!variantId) return;
      const r = await toggleStockAlert(variantId);
      if (!r.ok && r.error === "auth") return needLogin();
      if (r.ok)
        setAlerts((s) => {
          const next = new Set(s);
          if (next.has(variantId)) next.delete(variantId);
          else next.add(variantId);
          return next;
        });
      setMsg(r.ok ? { ok: true, text: r.message ?? "" } : { ok: false, text: r.error });
    });
  const soldOut = variant?.stock === 0;
  const watching = !!variantId && alerts.has(variantId);

  return (
    <div className="mt-6">
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold text-bronze">{formatPrice(finalPrice(p))}</span>
        {p.promo_price && (
          <>
            <span className="pb-1 text-lg text-neutral-400 line-through">{formatPrice(p.price)}</span>
            <span className="mb-1.5 rounded-full bg-alert px-2.5 py-0.5 font-mono text-xs font-bold">−{off} %</span>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-400">TTC · ou 4 × {formatPrice(finalPrice(p) / 4, true)} sans frais</p>

      <p className="label mt-6">Coloris : <span className="text-night">{variant?.color_name}</span></p>
      <div className="flex gap-3">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setVariantId(v.id);
              setMsg(null);
            }}
            aria-pressed={v.id === variantId}
            aria-label={`${v.color_name}${v.stock === 0 ? " (épuisé)" : ""}`}
            title={`${v.color_name} · ${v.stock === 0 ? "épuisé" : `${v.stock} en stock`}`}
            className={`relative h-11 w-11 overflow-hidden rounded-full border-2 transition ${v.stock === 0 ? "opacity-40" : ""} ${v.id === variantId ? "scale-110 border-bronze" : "border-black/15 hover:border-black/25"}`}
            style={{ background: `radial-gradient(circle at 35% 30%, #ffffff55, ${v.color_hex} 55%)` }}
          >
            {v.stock === 0 && <span aria-hidden className="absolute left-1/2 top-[-10%] h-[120%] w-0.5 -translate-x-1/2 rotate-45 bg-alert" />}
          </button>
        ))}
      </div>
      {soldOut && (
        <p className="mt-2 text-xs font-semibold text-alert">
          Coloris épuisé{watching ? " · alerte activée, on te prévient dès son retour" : ""}
        </p>
      )}
      {variant && variant.stock <= 3 && variant.stock > 0 && (
        <p className="mt-2 text-xs font-semibold text-alert">Plus que {variant.stock} en stock dans ce coloris</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {soldOut ? (
          <PillButton variant={watching ? "dark" : "heat"} plus={!watching} onClick={toggleAlert} disabled={pending} aria-pressed={watching} className={watching ? "pr-6" : ""}>
            {pending ? "…" : watching ? "✓ Alerte activée · Annuler" : loggedIn ? "Me prévenir du retour" : "Se connecter pour être prévenu"}
          </PillButton>
        ) : (
          <PillButton variant="heat" onClick={add} disabled={pending || !variant}>
            {pending ? "Ajout…" : loggedIn ? "Ajouter au panier" : "Se connecter pour acheter"}
          </PillButton>
        )}
        <button
          onClick={favorite}
          aria-pressed={fav}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`grid h-[50px] w-[50px] place-items-center rounded-full border transition ${fav ? "border-bronze bg-bronze/15 text-bronze" : "border-black/15 text-neutral-700 hover:text-night"}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.5 4.5 7 4.5c2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 3.5 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21Z" />
          </svg>
        </button>
      </div>
      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-legal" : "text-alert"}`}>
          {msg.text}
          {msg.cart && (
            <a href="/panier" className="ml-2 underline">
              Voir le panier →
            </a>
          )}
        </p>
      )}
    </div>
  );
}
