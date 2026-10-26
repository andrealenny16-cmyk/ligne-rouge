"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Recommendation } from "@/lib/recommend";
import { finalPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { UsageBadge } from "./ui";

type Result = {
  engine: "claude" | "regles";
  vehicle: string | null;
  usage: "route" | "circuit";
  recommendation: Recommendation | null;
  product: Product | null;
  alternatives: Product[];
  blockedCircuit: boolean;
  message: string;
};

const EXAMPLES = [
  { vehicle: "Golf 8 GTI", wish: "je veux un son agressif mais rester légal" },
  { vehicle: "Yamaha MT-09 2024", wish: "un look radical et un son rauque" },
  { vehicle: "Mercedes A45 S", wish: "pour mes journées circuit, le max de chevaux" },
];

export default function ConfiguratorForm({ compact = false, initialVehicle = "" }: { compact?: boolean; initialVehicle?: string }) {
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [wish, setWish] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const submit = async (e?: React.FormEvent, v = vehicle, w = wish) => {
    e?.preventDefault();
    if (!v.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/configurateur", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicle: v, wish: w }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Erreur");
      setRes(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className={`grid gap-3 ${compact ? "" : "md:grid-cols-[1fr_1.4fr_auto] md:items-end"}`}>
        <label>
          <span className="label">Ton véhicule</span>
          <input className="field" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="ex. Golf 8 GTI 2022" required maxLength={200} />
        </label>
        <label>
          <span className="label">Ton envie</span>
          <input className="field" value={wish} onChange={(e) => setWish(e.target.value)} placeholder="ex. un son agressif mais rester légal" maxLength={500} />
        </label>
        <button disabled={loading} className="bg-heat h-[50px] rounded-full px-7 font-bold transition hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? "Analyse…" : "Recommander"}
        </button>
      </form>

      {!compact && !res && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.vehicle}
              onClick={() => {
                setVehicle(ex.vehicle);
                setWish(ex.wish);
                void submit(undefined, ex.vehicle, ex.wish);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:border-bronze/50 hover:text-white"
            >
              « {ex.vehicle}, {ex.wish} »
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-[#ff7a84]">{error}</p>}

      {res && (
        <div className="mt-6 space-y-4" aria-live="polite">
          <p className="font-mono text-[0.65rem] tracking-widest text-white/40">
            {res.vehicle ? `VÉHICULE RECONNU : ${res.vehicle.toUpperCase()}` : "VÉHICULE NON RECONNU"} · USAGE {res.usage.toUpperCase()} ·{" "}
            {res.engine === "claude" ? "RECOMMANDATION CLAUDE" : "MOTEUR À RÈGLES"}
          </p>

          {res.product && res.recommendation ? (
            <div className={`glass grid gap-5 rounded-3xl p-4 ${compact ? "" : "md:grid-cols-[240px_1fr] md:p-6"}`}>
              <Link href={`/produit/${res.product.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-paper">
                <Image src={`/products/${res.product.slug}-34.svg`} alt={res.product.name} fill sizes="240px" className="object-contain" />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <UsageBadge usage={res.product.usage} />
                  <span className="font-mono text-xs text-white/45">REF. {res.product.ref}</span>
                </div>
                <p className="mt-1 font-display text-4xl uppercase">{res.product.name}</p>
                <p className="mt-2 text-sm text-white/80">{res.recommendation.pitch}</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="label !mb-1">Gain estimé</dt><dd className="font-semibold text-bronze">{res.recommendation.gain}</dd></div>
                  <div className="sm:col-span-2"><dt className="label !mb-1">Le son</dt><dd className="text-white/80">{res.recommendation.sound}</dd></div>
                </dl>
                <p className={`mt-4 rounded-2xl p-3 text-xs ${res.product.usage === "route" ? "bg-legal/10 text-legal" : "bg-alert/10 text-[#ff8a92]"}`}>{res.recommendation.legal}</p>
                <Link href={`/produit/${res.product.slug}`} className="mt-4 inline-flex items-center gap-3 rounded-full bg-black/50 py-1.5 pl-5 pr-1.5 font-bold">
                  Voir le produit · {formatPrice(finalPrice(res.product))}
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-bronze text-xl text-ink">+</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl p-5 text-sm text-white/75">
              {res.message}{" "}
              {!res.vehicle && "Précise la marque et le modèle (ex. « BMW M240i », « Kawasaki ZX-10R »)."}
            </div>
          )}

          {res.blockedCircuit && (
            <p className="text-xs text-white/50">
              Une version circuit existe pour ce véhicule, mais elle n&apos;est pas proposée car tu souhaites rouler sur route.
            </p>
          )}
          {!compact && res.alternatives.length > 0 && (
            <p className="text-sm text-white/60">
              Aussi compatible :{" "}
              {res.alternatives.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ", "}
                  <Link className="text-bronze underline" href={`/produit/${a.slug}`}>{a.name}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
