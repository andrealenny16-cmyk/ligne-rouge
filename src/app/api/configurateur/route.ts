import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getVehicles } from "@/lib/catalog";
import { allowedProducts, matchModel, parseIntent, ruleRecommendation, type Recommendation } from "@/lib/recommend";
import { getSession } from "@/lib/supabase/server";
import { PRODUCT_SELECT, type Product } from "@/lib/types";

/* Skill IA du site : « Configurateur Son & Perf »
   1. retrouve le modèle en base et les produits compatibles
   2. demande une recommandation à Claude (si ANTHROPIC_API_KEY)
   3. sinon, ou si la réponse est invalide : moteur à règles
   4. journalise l'échange dans ai_configurator_logs */

const MODEL = "claude-sonnet-5-5";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { vehicle?: string; wish?: string };
  const vehicle = String(body.vehicle ?? "").slice(0, 200).trim();
  const wish = String(body.wish ?? "").slice(0, 500).trim();
  if (!vehicle) return NextResponse.json({ error: "Décris ton véhicule" }, { status: 400 });

  const { supabase, user } = await getSession();
  const { makes, models } = await getVehicles();
  const model = matchModel(`${vehicle} ${wish}`, makes, models);
  const make = model ? makes.find((m) => m.id === model.make_id) : null;
  const label = model ? `${make?.name} ${model.name}` : null;
  const intent = parseIntent(`${vehicle} ${wish}`);

  let products: Product[] = [];
  if (model) {
    const { data: compat } = await supabase.from("product_compatibility").select("product_id").eq("model_id", model.id);
    const ids = (compat ?? []).map((c) => c.product_id);
    if (ids.length) {
      const { data } = await supabase.from("products").select(PRODUCT_SELECT).in("id", ids).eq("is_active", true);
      products = (data ?? []) as unknown as Product[];
    }
  }

  const allowed = allowedProducts(products, intent);
  let rec: Recommendation | null = null;
  let engine: "claude" | "regles" = "regles";

  if (process.env.ANTHROPIC_API_KEY && allowed.length) {
    try {
      rec = await askClaude(vehicle, wish, label, intent.usage, allowed);
      if (rec) engine = "claude";
    } catch (e) {
      console.error("configurateur: repli sur les règles", e);
    }
  }
  rec ??= ruleRecommendation(products, intent, label);

  const recommended = rec ? products.find((p) => p.slug === rec.slug) : undefined;
  const alternatives = allowed.filter((p) => p.slug !== rec?.slug);
  const blockedCircuit = intent.usage === "route" && products.some((p) => p.usage === "circuit");

  const response = model
    ? rec
      ? `${rec.pitch} ${rec.sound} ${rec.legal}`
      : "Aucun pot homologué route n'est encore disponible pour ce véhicule."
    : "Véhicule non reconnu dans notre base.";

  await supabase.from("ai_configurator_logs").insert({
    user_id: user?.id ?? null,
    vehicle_input: vehicle,
    wish: wish || null,
    matched_model_id: model?.id ?? null,
    response,
    recommended_products: recommended ? [recommended.id] : [],
    engine,
  });

  return NextResponse.json({
    engine,
    vehicle: label,
    model: model ? { id: model.id, generation: model.generation, power_hp: model.power_hp } : null,
    usage: intent.usage,
    recommendation: rec,
    product: recommended ?? null,
    alternatives,
    blockedCircuit,
    message: response,
  });
}

async function askClaude(vehicle: string, wish: string, label: string | null, usage: "route" | "circuit", candidates: Product[]): Promise<Recommendation | null> {
  const client = new Anthropic();
  const specs = candidates.map((p) => ({
    slug: p.slug,
    nom: p.name,
    usage: p.usage,
    materiau: p.material,
    db: p.db_level_max ? `${p.db_level}-${p.db_level_max}` : p.db_level,
    gain_ch: p.hp_gain,
    gain_nm: p.torque_gain,
    poids_gagne_kg: p.weight_saving_kg,
    prix: p.promo_price ?? p.price,
    description: p.description,
  }));

  const msg = await client.messages.create(
    {
      model: MODEL,
      max_tokens: 600,
      system:
        "Tu es le conseiller technique de DÉCIBEL Performance, fabricant français d'échappements. " +
        "Tu recommandes UN seul produit parmi la liste fournie, jamais un autre. " +
        "Règle absolue : si le client veut rouler sur route, ne recommande jamais un produit dont usage = circuit. " +
        "Réponds uniquement en JSON valide, sans texte autour, au format " +
        '{"slug": string, "gain": string, "sound": string, "legal": string, "pitch": string}. ' +
        "gain : gain estimé (ch, Nm, kg). sound : description du son en une ou deux phrases évocatrices. " +
        "legal : rappel du respect route/circuit. pitch : une phrase personnalisée. Tutoie le client, en français.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({ vehicule_saisi: vehicle, vehicule_reconnu: label, envie: wish || "non précisée", usage_detecte: usage, produits_compatibles: specs }),
        },
      ],
    },
    { timeout: 15000 },
  );

  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Recommendation;
  const chosen = candidates.find((p) => p.slug === json.slug);
  // Contrôle serveur de la règle route/circuit, quoi que réponde le modèle
  if (!chosen || (usage === "route" && chosen.usage === "circuit")) return null;
  return json;
}
