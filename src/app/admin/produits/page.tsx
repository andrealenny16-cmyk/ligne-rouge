import type { Metadata } from "next";
import ProductEditor from "@/components/admin/ProductEditor";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, type Product } from "@/lib/types";

export const metadata: Metadata = { title: "Produits · Admin" };

export default async function AdminProducts() {
  const supabase = await createClient();
  // RLS : un admin voit aussi les produits désactivés
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).order("ref");
  const products = (data ?? []) as unknown as Product[];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map((p) => (
        <ProductEditor key={p.id} product={p} />
      ))}
    </div>
  );
}
