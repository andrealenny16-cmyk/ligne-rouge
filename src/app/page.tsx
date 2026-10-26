import Link from "next/link";
import Hero from "@/components/hero/Hero";
import Photo from "@/components/Photo";
import ProductCard from "@/components/ProductCard";
import VehicleSelector from "@/components/VehicleSelector";
import { PillLink } from "@/components/ui";
import { getProducts, getVehicles } from "@/lib/catalog";
import { finalPrice } from "@/lib/format";

export default async function Home({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const [{ refus }, products, { makes, models }] = await Promise.all([searchParams, getProducts(), getVehicles()]);
  const from = (usage: string) => Math.min(...products.filter((p) => p.usage === usage).map(finalPrice));
  const promos = products.filter((p) => p.promo_price);

  return (
    <>
      <Hero routeFrom={from("route")} circuitFrom={from("circuit")} />

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
        {/* Sélecteur véhicule */}
        <section className="glass relative -mt-px mt-16 rounded-[32px] p-6 md:p-10" id="trouver">
          <p className="label">Compatibilité garantie</p>
          <h2 className="mb-6 font-display text-4xl uppercase leading-none md:text-6xl">
            Trouve le pot de <span className="text-heat">ta caisse</span>
          </h2>
          <VehicleSelector makes={makes} models={models} />
        </section>

        {/* Entrées Voiture / Moto : photo plein cadre façon catalogue course */}
        <section className="mt-16 grid gap-5 md:grid-cols-2">
          {[
            { href: "/boutique?type=voiture", title: "Voiture", sub: "Lignes cat-back, silencieux à valve, décatas", photo: "/photos/categorie-voitures.jpg", fallback: "/products/titan-gt-34.svg", n: products.filter((p) => p.vehicle_type === "voiture").length },
            { href: "/boutique?type=moto", title: "Moto", sub: "Slip-on, double sous-selle, lignes 4-en-1", photo: "/photos/categorie-motos.jpg", fallback: "/products/hellcat-racing-34.svg", n: products.filter((p) => p.vehicle_type === "moto").length },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="photo group relative isolate flex aspect-[5/4] flex-col justify-end overflow-hidden rounded-[28px] border border-white/10 p-7 md:p-9">
              <Photo src={c.photo} fallback={c.fallback} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <span className="speed-lines absolute inset-x-0 top-1/2 -z-10 h-24 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <p className="font-mono text-xs tracking-widest text-white/60">{c.n} RÉFÉRENCES</p>
              <h3 className="font-display text-6xl uppercase italic leading-[0.85] md:text-8xl">Échappements {c.title}</h3>
              <p className="mt-2 text-white/70">{c.sub}</p>
              <span className="mt-6 inline-flex w-fit items-center gap-3 border border-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition group-hover:bg-white group-hover:text-night">
                Trouver mon système <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </section>

        {/* La gamme */}
        <section className="mt-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">Collection 2026</p>
              <h2 className="font-display text-5xl uppercase italic leading-none md:text-7xl">
                La <span className="text-heat">gamme</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm text-white/60">
              {promos.length} offres en cours · code <span className="font-mono text-bronze">ROUGE10</span> : −10 % supplémentaires au panier.
            </p>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Bandeau piste plein cadre */}
        <section className="photo relative isolate mt-24 overflow-hidden rounded-[28px] border border-white/10">
          <Photo src="/photos/ambiance-circuit.jpg" fallback={null} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-70" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <span className="speed-lines absolute inset-y-0 right-0 -z-10 w-2/3 opacity-60" />
          <div className="max-w-xl p-8 md:p-14">
            <p className="label text-alert">Racing</p>
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

        {/* Configurateur */}
        <section className="mt-6 flex flex-col items-start justify-between gap-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1E3A8A]/40 via-night to-[#8A1E0B]/40 p-8 md:flex-row md:items-center md:p-10">
          <div>
            <p className="label">Configurateur Son & Perf</p>
            <p className="font-display text-4xl uppercase italic leading-none">Pas sûr du bon choix ?</p>
            <p className="mt-3 max-w-lg text-sm text-white/65">Décris ton véhicule et ce que tu veux entendre. L&apos;IA te recommande le pot idéal, en respectant la loi.</p>
          </div>
          <PillLink href="/configurateur" variant="heat">
            Lancer le configurateur
          </PillLink>
        </section>

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
              <p className="text-sm text-white/60">{r.d}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
