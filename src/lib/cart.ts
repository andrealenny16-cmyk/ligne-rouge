import type { SupabaseClient } from "@supabase/supabase-js";
import { finalPrice } from "./format";
import type { Usage } from "./types";

export type CartLine = {
  id: string;
  quantity: number;
  variant: { id: string; color_name: string; color_hex: string; stock: number };
  product: { id: string; name: string; slug: string; ref: string; usage: Usage; price: number; promo_price: number | null };
};

export const SHIPPING_FREE_FROM = 500;
export const SHIPPING_COST = 19.9;

export async function getCart(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("cart_items")
    .select("id, quantity, product_variants(id, color_name, color_hex, stock, products(id, name, slug, ref, usage, price, promo_price))")
    .eq("user_id", userId)
    .order("added_at");
  type Row = { id: string; quantity: number; product_variants: CartLine["variant"] & { products: CartLine["product"] } };
  const lines: CartLine[] = ((data ?? []) as unknown as Row[]).map((r) => {
    const { products, ...variant } = r.product_variants;
    return { id: r.id, quantity: r.quantity, variant, product: products };
  });
  const subtotal = lines.reduce((s, l) => s + finalPrice(l.product) * l.quantity, 0);
  return { lines, subtotal, hasCircuit: lines.some((l) => l.product.usage === "circuit") };
}

/** Même calcul que la fonction SQL checkout() — affichage uniquement, la base fait foi. */
export function totals(subtotal: number, percent = 0) {
  const discount = Math.round(subtotal * percent) / 100;
  const shipping = subtotal - discount >= SHIPPING_FREE_FROM || subtotal === 0 ? 0 : SHIPPING_COST;
  return { discount, shipping, total: subtotal - discount + shipping };
}
