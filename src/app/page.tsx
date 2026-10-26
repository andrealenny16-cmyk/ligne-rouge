import Link from "next/link";
import ConfiguratorForm from "@/components/ConfiguratorForm";
import Hero from "@/components/hero/Hero";
import Photo from "@/components/Photo";
import ProductCard from "@/components/ProductCard";
import VehicleSelector from "@/components/VehicleSelector";
import { Stars } from "@/components/ui";
import { getProducts, getVehicles } from "@/lib/catalog";
import { finalPrice, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Product, VehicleType } from "@/lib/types";

/* Site en une page : on arrive sur le hero et on descend.
   #accueil → #trouver → #voiture → #moto → #piste → #conseil → #avis (ancres du menu). */

const UNIVERS: Record<VehicleType, { n: string; title: string; sub: string; photo: string; pitch: string }> = {
  voiture: {
    n: "01",
    title: "Voiture",
    sub: "Lignes cat-back, silencieux à valve, lignes décatalysées",
    photo: "/photos/categorie-voitures.jpg",
    pitch: "Du grave rond en ville au hurlement continu sur circuit : trois architectures, une même obsession du son.",
  },
  moto: {
    n: "02",
    title: "Moto",
    sub: "Slip-on, double sous-selle, lignes 4-en-1",
    photo: "/photos/categorie-motos.jpg",
    pitch: "Du bicylindre qui gronde au quatre-cylindres qui crie à 14 000 tr/min : le titane au service de la poussée.",
  },
};

function Univers({ type, products }: { type: VehicleType; products: Product[] }) {
  const u = UNIVERS[type];
  const list = products.filter((p) => p.vehicle_type === type);
  return (
    <section id={type} className="mt-24 scroll-mt-24">
      <div className="photo relative isolate flex min-h-[380px] flex-col justify-end overflow-hidden rounded-[28px] p-7 text-white md:min-h-[440px] md:p-12">
        <Photo src={u.photo} alt="" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/10" />
        <span className="speed-lines absolute inset-x-0 top-1/3 -z-10 h-32 opacity-50" />
        <p className="font-mono text-xs tracking-[0.3em] text-white/70">
          {u.n} · UNIVERS {u.title.toUpperCase()} · {list.length} RÉFÉRENCES · DÈS {formatPrice(Math.min(...list.map(finalPrice)))}
        </p>
        <h2 className="mt-2 font-display text-[2.7rem] uppercase italic leading-[0.85] sm:text-6xl md:text-8xl">
          Échappements <span className="text-heat">{u.title}</span>
        </h2>
        <p className="mt-3 max-w-xl text-white/75">{u.pitch}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={`/boutique?type=${type}`}
            className="ml-auto inline-flex items-center gap-3 border border-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-white hover:text-night"
          >
            Filtrer par véhicule <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500">{u.sub}</p>
      <div className="mt-4 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const supabase = await createClient();
  const [{ refus }, products, { makes, models }, { data: reviews }] = await Promise.all([
    searchParams,
    getProducts(),
    getVehicles(),
    supabase.from("reviews").select("id, author_name, rating, comment, products(name, slug, vehicle_type)").eq("rating", 5).order("created_at", { ascending: false }).limit(3),
  ]);
  const from = (t: VehicleType, usage: string) =>
    Math.min(...products.filter((p) => p.vehicle_type === t && p.usage === usage).map(finalPrice));
  const prices = {
    moto: { route: from("moto", "route"), circuit: from("moto", "circuit") },
    voiture: { route: from("voiture", "route"), circuit: from("voiture", "circuit") },
  };

  return (
    <>
      <Hero prices={prices} />

      {refus === "admin" && (
        <div className="mx-auto mt-6 max-w-7xl px-4 md:px-8">
          <p className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm">
            Accès refusé : l&apos;espace administrateur est réservé aux comptes admin.
          </p>
        </div>
      )}

      {/* Bandeau défilant */}
      <div className="overflow-hidden border-y border-white/10 bg-night-2 py-4">
        <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-12 whitespace-nowrap font-display text-2xl uppercase tracking-wide text-white/80">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Titane grade 2", "Embouts carbone", "Soudé main en France", "Homologué route", "100 % circuit", "Valve pilotée", "Jusqu'à +28 ch"].map((t) => (
              <span key={`${k}-${t}`} className="flex items-center gap-12">
                {t} <span className="text-bronze">✦</span>
              </span>
            )),
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Recherche par véhicule */}
        <section className="glass relative mt-16 scroll-mt-28 rounded-[32px] p-6 md:p-10" id="trouver">
          <p className="label">Compatibilité garantie</p>
          <h2 className="mb-6 font-display text-4xl uppercase italic leading-none md:text-6xl">
            Trouve le pot de <span className="text-heat">ta caisse</span>
          </h2>
          <VehicleSelector makes={makes} models={models} />
        </section>

        <Univers type="voiture" products={products} />
        <Univers type="moto" products={products} />

        {/* La piste */}
        <section id="piste" className="photo relative isolate mt-24 scroll-mt-24 overflow-hidden rounded-[28px] text-white">
          <Photo src="/photos/ambiance-circuit.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-70" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <span className="speed-lines absolute inset-y-0 right-0 -z-10 w-2/3 opacity-60" />
          <div className="max-w-xl p-8 md:p-14">
            <p className="label !text-alert">Racing</p>
            <h2 className="font-display text-5xl uppercase italic leading-[0.9] md:text-7xl">La piste est notre labo</h2>
            <p className="mt-4 text-white/70">
              Chaque ligne est validée au banc de puissance puis au sonomètre, et nos versions circuit naissent sur les trackdays.
              Titane grade 2, soudure TIG main, gain mesuré, pas promis.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                ["+28 ch", "gain max"],
                ["−11,5 kg", "allègement max"],
                ["112 dB", "version circuit"],
              ].map(([v, k]) => (
                <div key={k}>
                  <p className="font-display text-3xl">{v}</p>
                  <p className="font-mono text-[0.65rem] uppercase tracking-widest text-white/50">{k}</p>
                </div>
              ))}
            </div>
            <Link href="/boutique?usage=circuit" className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-night transition hover:bg-bronze">
              Gamme circuit <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Conseil IA intégré */}
        <section id="conseil" className="mt-24 grid scroll-mt-28 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="label">Configurateur Son & Perf · IA</p>
            <h2 className="font-display text-5xl uppercase italic leading-[0.9] md:text-6xl">
              Dis-nous ce que tu veux <span className="text-heat">entendre</span>
            </h2>
            <p className="mt-4 text-neutral-600">
              Décris ton véhicule et ton envie. On retrouve ton modèle, on filtre les pots compatibles, et l&apos;IA te recommande le bon,
              avec le gain estimé et le son décrit en mots. Jamais de pot circuit pour un usage route.
            </p>
          </div>
          <div className="glass rounded-[28px] p-5 md:p-7">
            <ConfiguratorForm />
          </div>
        </section>

        {/* Avis */}
        {reviews && reviews.length > 0 && (
          <section id="avis" className="mt-24 scroll-mt-28">
            <h2 className="font-display text-5xl uppercase italic leading-none md:text-6xl">
              Ils roulent en <span className="text-rouge">Ligne Rouge</span>
            </h2>
            <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-neutral-400">Avis de démonstration</p>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => {
                const prod = r.products as unknown as { name: string; slug: string; vehicle_type: VehicleType } | null;
                return (
                  <figure key={r.id} className="glass rounded-[24px] p-6">
                    <Stars rating={r.rating} />
                    <blockquote className="mt-3 leading-relaxed">« {r.comment} »</blockquote>
                    <figcaption className="mt-4 text-sm text-neutral-500">
                      {r.author_name} ·{" "}
                      <Link href={`/produit/${prod?.slug}`} className="font-semibold text-night underline-offset-2 hover:underline">
                        {prod?.name}
                      </Link>{" "}
                      <span className="font-mono text-[0.65rem] uppercase">({prod?.vehicle_type})</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {/* Réassurance */}
        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            { k: "Livraison offerte", v: "dès 500 €", d: "Expédition sous 48 h, colis assuré." },
            { k: "Garantie", v: "2 ans", d: "Pièces et soudures, sans conditions." },
            { k: "Paiement", v: "en 4x", d: "Sans frais à partir de 300 €." },
          ].map((r) => (
            <div key={r.k} className="glass rounded-3xl p-6">
              <p className="label">{r.k}</p>
              <p className="font-display text-5xl uppercase text-bronze">{r.v}</p>
              <div className="cote my-4" />
              <p className="text-sm text-neutral-600">{r.d}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
