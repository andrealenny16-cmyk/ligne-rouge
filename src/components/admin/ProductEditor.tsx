"use client";

import Photo, { productPhoto } from "@/components/Photo";
import { useActionState } from "react";
import { updateProduct } from "@/app/actions";
import { UsageBadge } from "@/components/ui";
import type { Product } from "@/lib/types";

export default function ProductEditor({ product: p }: { product: Product }) {
  const [state, action, pending] = useActionState(updateProduct, null);
  return (
    <form action={action} className={`glass rounded-3xl p-5 ${p.is_active ? "" : "opacity-60"}`}>
      <input type="hidden" name="id" value={p.id} />
      <div className="flex items-center gap-4">
        <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-2xl photo">
          <Photo src={productPhoto(p.slug)} alt="" fill sizes="96px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-white/45">REF. {p.ref}</p>
          <p className="font-display text-2xl uppercase leading-none">{p.name}</p>
          <UsageBadge usage={p.usage} className="mt-1" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={p.is_active} className="h-5 w-5 accent-[#E8A36B]" /> Actif
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label><span className="label">Prix TTC (€)</span><input name="price" type="number" step="0.01" min="1" required defaultValue={p.price} className="field" /></label>
        <label><span className="label">Prix promo (€)</span><input name="promo_price" type="number" step="0.01" min="1" defaultValue={p.promo_price ?? ""} placeholder="—" className="field" /></label>
        {(p.product_variants ?? []).map((v) => (
          <label key={v.id}>
            <span className="label flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: v.color_hex }} /> Stock {v.color_name}
            </span>
            <input name={`stock_${v.id}`} type="number" min="0" defaultValue={v.stock} className={`field ${v.stock <= 3 ? "!border-alert/50" : ""}`} />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={pending} className="rounded-full bg-bronze px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-50">
          {pending ? "…" : "Enregistrer"}
        </button>
        {state && <span className={`text-sm ${state.ok ? "text-legal" : "text-[#ff7a84]"}`}>{state.ok ? state.message : state.error}</span>}
      </div>
    </form>
  );
}
