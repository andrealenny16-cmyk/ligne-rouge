import type { Product, Usage, VehicleMake, VehicleModel } from "./types";

/* Logique métier du « Configurateur Son & Perf », utilisée seule (sans clé API)
   ou pour préparer et contrôler la réponse de Claude. */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Retrouve le modèle le plus probable dans le texte libre du client. */
export function matchModel(text: string, makes: VehicleMake[], models: VehicleModel[]) {
  const t = ` ${norm(text)} `;
  const compact = t.replace(/ /g, "");
  let best: { model: VehicleModel; score: number } | null = null;
  for (const m of models) {
    const make = makes.find((mk) => mk.id === m.make_id);
    const name = norm(m.name);
    let score = 0;
    if (t.includes(` ${name} `) || compact.includes(name.replace(/ /g, ""))) score += 10 + name.length;
    else {
      const tokens = name.split(" ").filter((w) => w.length > 1);
      const hits = tokens.filter((w) => t.includes(` ${w} `) || (/\d/.test(w) && compact.includes(w)));
      score += hits.length * 3;
      if (hits.length && hits.length === tokens.length) score += 4;
    }
    if (m.generation && t.includes(` ${norm(m.generation)} `)) score += 3;
    if (make && t.includes(norm(make.name))) score += 4;
    if (!best || score > best.score) best = { model: m, score };
  }
  return best && best.score >= 6 ? best.model : null;
}

export type Intent = { usage: Usage; aggressive: boolean; discreet: boolean };

export function parseIntent(wish: string): Intent {
  const w = norm(wish);
  const wantsCircuit = /\b(circuit|piste|track|chrono|trackday|competition|course)\b/.test(w);
  const wantsRoad = /\b(legal|route|homolog\w*|quotidien|tous les jours|ville|autoroute|controle|ct|rester legal)\b/.test(w);
  return {
    // Par sécurité : sans demande explicite de piste, on reste sur route
    usage: wantsCircuit && !wantsRoad ? "circuit" : "route",
    aggressive: /\b(agressif|fort|bruyant|max|hurle|crie|violent|rageur|grave|brutal|pop|petarade\w*)\b/.test(w),
    discreet: /\b(discret|calme|leger|sobre|voisins)\b/.test(w),
  };
}

/** Produits autorisés pour l'intention : jamais de circuit pour un usage route. */
export function allowedProducts(products: Product[], intent: Intent) {
  return intent.usage === "route" ? products.filter((p) => p.usage === "route") : products;
}

export function rankProducts(products: Product[], intent: Intent) {
  return [...products].sort((a, b) => {
    const score = (p: Product) =>
      (intent.usage === "circuit" && p.usage === "circuit" ? 50 : 0) +
      (intent.aggressive ? p.db_level_max ?? p.db_level : 0) +
      (intent.discreet ? 120 - p.db_level : 0) +
      p.hp_gain;
    return score(b) - score(a);
  });
}

export function soundWords(p: Product) {
  const db = p.db_level_max ?? p.db_level;
  if (p.usage === "circuit") return "Hurlement métallique continu, détonations sèches au rétrogradage, aucune retenue.";
  if (p.db_level_max) return "Deux visages : feutré en mode discret, puis un grave rageur dès que la valve s'ouvre.";
  if (db >= 95) return "Rauque et rageur, des montées en régime qui claquent sans bourdonner sur autoroute.";
  return "Grave rond au ralenti, rugissement métallique en haut des tours, civilisé à vitesse stabilisée.";
}

export function ruleRecommendation(products: Product[], intent: Intent, vehicleLabel: string | null) {
  const ranked = rankProducts(allowedProducts(products, intent), intent);
  const pick = ranked[0];
  if (!pick) return null;
  return {
    slug: pick.slug,
    gain: `+${pick.hp_gain} ch${pick.torque_gain ? ` / +${pick.torque_gain} Nm` : ""}, −${pick.weight_saving_kg} kg`,
    sound: soundWords(pick),
    legal:
      pick.usage === "route"
        ? `Homologué route (${pick.db_level}${pick.db_level_max ? `–${pick.db_level_max}` : ""} dB) : tu restes en règle au quotidien.`
        : "Circuit uniquement : usage exclusif sur circuit fermé, non homologué pour la voie publique.",
    pitch: `${vehicleLabel ? `Pour ta ${vehicleLabel}, ` : ""}le ${pick.name} est le meilleur compromis entre ce que tu veux entendre et ce que tu veux sentir.`,
  };
}

export type Recommendation = NonNullable<ReturnType<typeof ruleRecommendation>>;
