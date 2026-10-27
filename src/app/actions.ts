"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@/lib/supabase/server";

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function authed() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/connexion");
  return { supabase, user };
}

/* ---------- Tracking ---------- */

export async function trackEvent(type: "view_product" | "compat_check", productId?: string, metadata?: Record<string, unknown>) {
  const { supabase, user } = await getSession();
  await supabase.from("events").insert({ type, product_id: productId ?? null, user_id: user?.id ?? null, metadata: metadata ?? null });
}

/* ---------- Panier (persisté en base) ---------- */

export async function addToCart(variantId: string, quantity = 1): Promise<Result> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: "auth" };
  const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("variant_id", variantId).maybeSingle();
  const { data: variant } = await supabase.from("product_variants").select("stock, product_id").eq("id", variantId).single();
  if (!variant) return { ok: false, error: "Variante introuvable" };
  const next = Math.min(10, (existing?.quantity ?? 0) + quantity);
  if (next > variant.stock) return { ok: false, error: `Plus que ${variant.stock} en stock pour ce coloris` };
  const { error } = existing
    ? await supabase.from("cart_items").update({ quantity: next }).eq("id", existing.id)
    : await supabase.from("cart_items").insert({ user_id: user.id, variant_id: variantId, quantity });
  if (error) return { ok: false, error: error.message };
  await supabase.from("events").insert({ type: "add_to_cart", product_id: variant.product_id, user_id: user.id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Ajouté au panier" };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { supabase } = await authed();
  if (quantity <= 0) return removeCartItem(itemId);
  await supabase.from("cart_items").update({ quantity: Math.min(10, quantity) }).eq("id", itemId);
  revalidatePath("/", "layout");
}

export async function removeCartItem(itemId: string) {
  const { supabase, user } = await authed();
  const { data } = await supabase.from("cart_items").select("product_variants(product_id)").eq("id", itemId).single();
  await supabase.from("cart_items").delete().eq("id", itemId);
  const productId = (data?.product_variants as unknown as { product_id: string } | null)?.product_id;
  await supabase.from("events").insert({ type: "remove_from_cart", product_id: productId ?? null, user_id: user.id });
  revalidatePath("/", "layout");
}

export async function checkPromo(code: string): Promise<{ percent: number } | { error: string }> {
  const { supabase } = await authed();
  const { data, error } = await supabase.rpc("validate_promo", { p_code: code });
  if (error || !data) return { error: "Code promo invalide ou expiré" };
  return { percent: data as number };
}

/* ---------- Commande ---------- */

export async function placeOrder(_: unknown, form: FormData): Promise<Result> {
  const { supabase } = await authed();
  const addressId = String(form.get("address_id") ?? "");
  if (!addressId) return { ok: false, error: "Choisis une adresse de livraison" };
  const { data, error } = await supabase.rpc("checkout", {
    p_address_id: addressId,
    p_promo_code: String(form.get("promo") ?? "") || null,
    p_circuit_ack: form.get("circuit_ack") === "on",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  redirect(`/commande/confirmation/${data}`);
}

/* ---------- Favoris ---------- */

export async function toggleFavorite(productId: string): Promise<Result> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: "auth" };
  const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
  if (data) await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
  else await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
  revalidatePath("/compte");
  return { ok: true, message: data ? "Retiré des favoris" : "Ajouté aux favoris" };
}

/* ---------- Alertes retour en stock ---------- */

export async function toggleStockAlert(variantId: string): Promise<Result> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: "auth" };
  const { data } = await supabase.from("stock_alerts").select("id").eq("user_id", user.id).eq("variant_id", variantId).maybeSingle();
  if (data) {
    await supabase.from("stock_alerts").delete().eq("id", data.id);
    revalidatePath("/compte");
    return { ok: true, message: "Alerte supprimée" };
  }
  // la policy d'insert refuse un coloris qui n'est pas épuisé
  const { error } = await supabase.from("stock_alerts").insert({ user_id: user.id, variant_id: variantId });
  if (error) return { ok: false, error: "Ce coloris est de nouveau disponible" };
  revalidatePath("/compte");
  return { ok: true, message: "C'est noté : on te prévient dès son retour" };
}

export async function deleteStockAlert(id: string) {
  const { supabase } = await authed();
  await supabase.from("stock_alerts").delete().eq("id", id);
  revalidatePath("/compte");
}

/* ---------- Avis ---------- */

export async function addReview(_: unknown, form: FormData): Promise<Result> {
  const { supabase, user } = await authed();
  const productId = String(form.get("product_id"));
  const rating = Number(form.get("rating"));
  const comment = String(form.get("comment") ?? "").trim();
  if (!(rating >= 1 && rating <= 5) || comment.length < 3) return { ok: false, error: "Note et commentaire requis" };
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single();
  const author = profile?.full_name?.split(" ")[0] || profile?.email.split("@")[0] || "Client";
  const { error } = await supabase.from("reviews").insert({ product_id: productId, user_id: user.id, author_name: author, rating, comment });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/produit/${form.get("slug")}`);
  return { ok: true, message: "Merci pour ton avis !" };
}

/* ---------- Adresses ---------- */

export async function addAddress(_: unknown, form: FormData): Promise<Result> {
  const { supabase, user } = await authed();
  const row = {
    user_id: user.id,
    label: String(form.get("label") || "Domicile"),
    line1: String(form.get("line1") ?? "").trim(),
    city: String(form.get("city") ?? "").trim(),
    zip: String(form.get("zip") ?? "").trim(),
    country: String(form.get("country") || "France"),
  };
  if (!row.line1 || !row.city || !row.zip) return { ok: false, error: "Adresse, ville et code postal requis" };
  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { error } = await supabase.from("addresses").insert({ ...row, is_default: !count });
  if (error) return { ok: false, error: error.message.includes("zip") ? "Code postal invalide" : error.message };
  revalidatePath("/compte");
  revalidatePath("/commande");
  return { ok: true, message: "Adresse enregistrée" };
}

export async function deleteAddress(id: string) {
  const { supabase } = await authed();
  await supabase.from("addresses").delete().eq("id", id);
  revalidatePath("/compte");
}

/* ---------- Garage ---------- */

export async function addGarageVehicle(_: unknown, form: FormData): Promise<Result> {
  const { supabase, user } = await authed();
  const modelId = Number(form.get("model_id"));
  const year = Number(form.get("year"));
  if (!modelId || !year) return { ok: false, error: "Modèle et année requis" };
  const { error } = await supabase.from("garage_vehicles").insert({
    user_id: user.id,
    model_id: modelId,
    year,
    nickname: String(form.get("nickname") ?? "").trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/compte");
  return { ok: true, message: "Véhicule ajouté au garage" };
}

export async function deleteGarageVehicle(id: string) {
  const { supabase } = await authed();
  await supabase.from("garage_vehicles").delete().eq("id", id);
  revalidatePath("/compte");
}

/* ---------- Auth ---------- */

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ---------- Admin (RLS + is_admin() côté base) ---------- */

export async function updateOrderStatus(orderId: string, status: string) {
  const { supabase } = await authed();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath("/admin", "layout");
}

export async function updateProduct(_: unknown, form: FormData): Promise<Result> {
  const { supabase } = await authed();
  const id = String(form.get("id"));
  const price = Number(form.get("price"));
  const promoRaw = String(form.get("promo_price") ?? "").trim();
  const promo = promoRaw ? Number(promoRaw) : null;
  if (promo !== null && promo >= price) return { ok: false, error: "La promo doit être inférieure au prix" };
  const { error } = await supabase
    .from("products")
    .update({ price, promo_price: promo, is_active: form.get("is_active") === "on" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  for (const [k, v] of form.entries()) {
    if (k.startsWith("stock_")) {
      await supabase.from("product_variants").update({ stock: Math.max(0, Number(v)) }).eq("id", k.slice(6));
    }
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Produit mis à jour" };
}
