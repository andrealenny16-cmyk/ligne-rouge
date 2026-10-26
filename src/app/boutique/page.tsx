import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import BoutiqueFilters from "@/components/BoutiqueFilters";
import { Page, PageTitle } from "@/components/ui";
import { getVehicles } from "@/lib/catalog";
import { finalPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, type Product } from "@/lib/types";

export const metadata: Metadata = { title: "Boutique" };

type Params = Record<string, string | undefined>;

export default async function Boutique({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { makes, models } = await getVehicles();

  // Modèle → type et marque implicites (lien depuis le sélecteur de l'accueil)
  const model = sp.model ? models.find((m) => m.id === Number(sp.model)) : undefined;
  const makeId = model?.make_id ?? (sp.make ? Number(sp.make) : undefined);
  const type = sp.type ?? (makeId ? makes.find((m) => m.id === makeId)?.type : undefined);

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true);
  if (type === "voiture" || type === "moto") query = query.eq("vehicle_type", type);
  if (sp.material) query = query.eq("material", sp.material);
  if (sp.usage === "route" || sp.usage === "circuit") query = query.eq("usage", sp.usage);

  // Filtre véhicule via la table de compatibilité (many-to-many)
  if (model || makeId) {
    const modelIds = model ? [model.id] : models.filter((m) => m.make_id === makeId).map((m) => m.id);
    const { data: compat } = await supabase.from("product_compatibility").select("product_id").in("model_id", modelIds);
    query = query.in("id", [...new Set((compat ?? []).map((c) => c.product_id))]);
  }

  const { data } = await query;
  let products = (data ?? []) as unknown as Product[];

  const min = sp.min ? Number(sp.min) : undefined;
  const max = sp.max ? Number(sp.max) : undefined;
  if (min !== undefined) products = products.filter((p) => finalPrice(p) >= min);
  if (max !== undefined) products = products.filter((p) => finalPrice(p) <= max);

  const sorters: Record<string, (a: Product, b: Product) => number> = {
    "prix-asc": (a, b) => finalPrice(a) - finalPrice(b),
    "prix-desc": (a, b) => finalPrice(b) - finalPrice(a),
    ch: (a, b) => b.hp_gain - a.hp_gain,
    db: (a, b) => b.db_level - a.db_level,
  };
  products.sort(sorters[sp.sort ?? ""] ?? ((a, b) => a.ref.localeCompare(b.ref)));

  const make = makes.find((m) => m.id === makeId);
  const title = model ? `${make?.name} ${model.name}` : type === "moto" ? "Motos" : type === "voiture" ? "Voitures" : "Boutique";

  return (
    <Page>
      <PageTitle kicker={model ? "Compatible avec" : "Catalogue LIGNE ROUGE"} title={title} accent={model ? (sp.year ?? "") : `${products.length}`}>
        {model
          ? `${products.length} échappement${products.length > 1 ? "s" : ""} testé${products.length > 1 ? "s" : ""} et validé${products.length > 1 ? "s" : ""} sur ce véhicule.`
          : "Lignes complètes, silencieux et embouts. Filtre par véhicule, matériau, usage ou budget."}
      </PageTitle>

      <BoutiqueFilters makes={makes} models={models} current={{ ...sp, type, make: makeId ? String(makeId) : undefined }} />

      {products.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="glass mt-8 rounded-3xl p-10 text-center">
          <p className="font-display text-3xl uppercase">Aucun pot pour ces critères</p>
          <p className="mt-2 text-neutral-600">Élargis les filtres ou demande conseil au configurateur.</p>
        </div>
      )}
    </Page>
  );
}
