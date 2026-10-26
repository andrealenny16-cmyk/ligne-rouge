"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCart, toggleFavorite } from "@/app/actions";
import { PillButton } from "@/components/ui";
import { discountPercent, finalPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function BuyBox({ product: p, loggedIn, isFavorite }: { product: Product; loggedIn: boolean; isFavorite: boolean }) {
  const router = useRouter();
  const variants = p.product_variants ?? [];
  const [variantId, setVariantId] = useState(variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id);
  const [fav, setFav] = useState(isFavorite);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const variant = variants.find((v) => v.id === variantId);
  const off = discountPercent(p);

  const needLogin = () => router.push(`/connexion?next=/produit/${p.slug}`);

  const add = () =>
    start(async () => {
      if (!variantId) return;
      const r = await addToCart(variantId);
      if (!r.ok && r.error === "auth") return needLogin();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Ajouté" } : { ok: false, text: r.error });
    });

  const favorite = () =>
    start(async () => {
      const r = await toggleFavorite(p.id);
      if (!r.ok && r.error === "auth") return needLogin();
      setFav((f) => !f);
    });

  return (
    <div className="mt-6">
      <div className="flex items-end gap-3">
        <span className={`text-4xl font-semibold ${p.promo_price ? "text-rouge" : ""}`}>{formatPrice(finalPrice(p))}</span>
        {p.promo_price && (
          <>
            <span className="pb-1 text-lg text-neutral-400 line-through">{formatPrice(p.price)}</span>
            <span className="mb-1.5 rounded-sm bg-ink px-2 py-0.5 text-xs font-semibold text-white">−{off} %</span>
          </>
        )}
      </div>
      <p className="mt-1 text-sm text-mute">TTC · ou 4 × {formatPrice(finalPrice(p) / 4, true)} sans frais</p>

      <p className="label mt-6">Coloris : <span className="text-ink">{variant?.color_name}</span></p>
      <div className="flex gap-3">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => setVariantId(v.id)}
            disabled={v.stock === 0}
            aria-label={`${v.color_name}${v.stock === 0 ? " (épuisé)" : ""}`}
            title={`${v.color_name} · ${v.stock} en stock`}
            className={`relative h-11 w-11 rounded-full border-2 transition disabled:opacity-30 ${v.id === variantId ? "border-ink ring-2 ring-ink ring-offset-2" : "border-neutral-300 hover:border-neutral-400"}`}
            style={{ background: `radial-gradient(circle at 35% 30%, #ffffff55, ${v.color_hex} 55%)` }}
          />
        ))}
      </div>
      {variant && variant.stock <= 3 && variant.stock > 0 && (
        <p className="mt-2 text-xs font-semibold text-rouge">Plus que {variant.stock} en stock dans ce coloris</p>
      )}

      <div className="mt-6 flex items-stretch gap-3">
        <PillButton variant="heat" className="flex-1" onClick={add} disabled={pending || !variant || variant.stock === 0}>
          {variant?.stock === 0 ? "Épuisé" : pending ? "Ajout…" : loggedIn ? "Ajouter au panier" : "Se connecter pour acheter"}
        </PillButton>
        <button
          onClick={favorite}
          aria-pressed={fav}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`grid w-[52px] place-items-center rounded-md border transition ${fav ? "border-rouge bg-rouge/5 text-rouge" : "border-neutral-300 text-neutral-700 hover:text-ink"}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.5 4.5 7 4.5c2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 3.5 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21Z" />
          </svg>
        </button>
      </div>
      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-legal" : "text-rouge"}`}>
          {msg.text}
          {msg.ok && (
            <a href="/panier" className="ml-2 underline">
              Voir le panier →
            </a>
          )}
        </p>
      )}
    </div>
  );
}
