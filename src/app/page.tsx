import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/hero/Hero";
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

        {/* Entrées Voitures / Motos */}
        <section className="mt-16 grid gap-5 md:grid-cols-2">
          {[
            { href: "/boutique?type=voiture", title: "Voitures", sub: "Lignes cat-back, silencieux à valve, décatas", img: "/products/titan-gt-cut.svg", n: products.filter((p) => p.vehicle_type === "voiture").length },
            { href: "/boutique?type=moto", title: "Motos", sub: "Slip-on, double sous-selle, lignes 4-en-1", img: "/products/hellcat-racing-cut.svg", n: products.filter((p) => p.vehicle_type === "moto").length },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="carbon sheen group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[32px] border border-white/10 p-8">
              <div className="relative z-10">
                <p className="font-mono text-xs tracking-widest text-white/50">{c.n} RÉFÉRENCES</p>
                <h3 className="font-display text-6xl uppercase md:text-8xl">{c.title}</h3>
                <p className="text-white/60">{c.sub}</p>
              </div>
              <Image
                src={c.img}
                alt=""
                width={800}
                height={600}
                className="absolute -bottom-10 -right-10 w-[75%] opacity-95 drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] transition duration-700 group-hover:-translate-y-4 group-hover:-rotate-3"
              />
              <span className="relative z-10 mt-6 inline-flex w-fit items-center gap-3 rounded-full bg-black/60 py-1.5 pl-5 pr-1.5 font-bold backdrop-blur">
                Explorer <span className="grid h-9 w-9 place-items-center rounded-full bg-bronze text-xl text-ink transition group-hover:rotate-90">+</span>
              </span>
            </Link>
          ))}
        </section>

        {/* Promos */}
        {promos.length > 0 && (
          <section className="mt-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label text-alert">Offres en cours</p>
                <h2 className="font-display text-5xl uppercase leading-none md:text-7xl">
                  Plein <span className="text-bronze">gaz</span> sur les prix
                </h2>
              </div>
              <p className="max-w-sm text-sm text-white/60">
                Code <span className="font-mono text-bronze">DECIBEL10</span> : −10 % supplémentaires au panier.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {promos.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1E3A8A]/40 via-night to-[#8A1E0B]/40 p-8">
                <div>
                  <p className="label">Configurateur Son & Perf</p>
                  <p className="font-display text-4xl uppercase leading-none">Pas sûr du bon choix ?</p>
                  <p className="mt-3 text-sm text-white/65">Décris ton véhicule et ce que tu veux entendre. L&apos;IA te recommande le pot idéal, en respectant la loi.</p>
                </div>
                <PillLink href="/configurateur" variant="heat" className="mt-6">
                  Lancer le configurateur
                </PillLink>
              </div>
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
              <p className="text-sm text-white/60">{r.d}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
