import Link from "next/link";
import Photo from "@/components/Photo";
import ProductCard from "@/components/ProductCard";
import VehicleSelector from "@/components/VehicleSelector";
import { PillLink, Stars } from "@/components/ui";
import { getProducts, getVehicles } from "@/lib/catalog";
import { finalPrice, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function Home({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const supabase = await createClient();
  const [{ refus }, products, { makes, models }, { data: reviews }] = await Promise.all([
    searchParams,
    getProducts(),
    getVehicles(),
    supabase.from("reviews").select("id, author_name, rating, comment, products(name, slug)").eq("rating", 5).order("created_at", { ascending: false }).limit(3),
  ]);
  const from = (type: string) => Math.min(...products.filter((p) => p.vehicle_type === type).map(finalPrice));

  return (
    <>
      {refus === "admin" && (
        <p className="bg-rouge px-4 py-3 text-center text-sm font-medium text-white">
          Accès refusé : l&apos;espace administrateur est réservé aux comptes admin.
        </p>
      )}

      {/* Hero photo */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Photo src="/photos/hero-route.jpg" fallback={null} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        <div className="mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 py-20 md:min-h-[640px] md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">Échappements titane · Fabriqué en France</p>
          <h1 className="mt-4 max-w-2xl font-display text-6xl font-semibold uppercase leading-[0.95] md:text-8xl">
            Le son.
            <br />
            La puissance.
          </h1>
          <p className="mt-5 max-w-md text-lg text-neutral-200">
            Lignes complètes et silencieux en titane grade 2, soudés main. Homologués route ou réservés au circuit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href="/boutique?type=voiture" variant="heat" plus>
              Échappements voiture
            </PillLink>
            <PillLink href="/boutique?type=moto" className="!bg-white !text-ink hover:!bg-neutral-200" plus>
              Échappements moto
            </PillLink>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Sélecteur véhicule */}
        <section id="trouver" className="relative z-10 -mt-12 rounded-md border border-line bg-white p-5 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.25)] md:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-3xl font-semibold uppercase md:text-4xl">Trouve le pot de ta caisse</h2>
            <p className="text-sm text-mute">Compatibilité vérifiée sur 18 modèles</p>
          </div>
          <VehicleSelector makes={makes} models={models} />
        </section>

        {/* Catégories */}
        <section className="mt-16 grid gap-5 md:grid-cols-2">
          {[
            { href: "/boutique?type=voiture", title: "Voiture", photo: "/photos/categorie-voitures.jpg", fallback: "/products/titan-gt-34.svg", type: "voiture" },
            { href: "/boutique?type=moto", title: "Moto", photo: "/photos/categorie-motos.jpg", fallback: "/products/hellcat-racing-34.svg", type: "moto" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="group relative isolate block aspect-[4/3] overflow-hidden rounded-md bg-paper md:aspect-[5/4]">
              <Photo src={c.photo} fallback={c.fallback} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="-z-10 object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white md:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                    {products.filter((p) => p.vehicle_type === c.type).length} références · dès {formatPrice(from(c.type))}
                  </p>
                  <h2 className="font-display text-5xl font-semibold uppercase md:text-6xl">Échappements {c.title}</h2>
                </div>
                <span className="hidden rounded-md bg-white px-4 py-2.5 text-sm font-semibold uppercase text-ink sm:block">Voir</span>
              </div>
            </Link>
          ))}
        </section>

        {/* Catalogue */}
        <section className="mt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">La gamme 2026</p>
              <h2 className="font-display text-4xl font-semibold uppercase md:text-5xl">Nos échappements</h2>
            </div>
            <Link href="/boutique" className="text-sm font-semibold uppercase tracking-wide underline-offset-4 hover:underline">
              Tout le catalogue →
            </Link>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Offre */}
        <section className="mt-20 flex flex-col items-start justify-between gap-4 rounded-md bg-rouge p-8 text-white md:flex-row md:items-center md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Offre de lancement</p>
            <p className="mt-1 font-display text-4xl font-semibold uppercase">−10 % avec le code ROUGE10</p>
            <p className="mt-1 text-white/80">Cumulable avec les prix promotionnels, valable sur toute la gamme.</p>
          </div>
          <PillLink href="/boutique" className="!bg-white !text-ink hover:!bg-neutral-200" plus>
            J&apos;en profite
          </PillLink>
        </section>

        {/* Savoir-faire */}
        <section className="mt-20 grid items-center gap-10 md:grid-cols-2">
          <div className="photo relative aspect-[4/3] overflow-hidden rounded-md">
            <Photo src="/photos/ambiance-atelier.jpg" fallback="/products/inferno-r-profil.svg" alt="Soudure TIG d'une ligne titane" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div>
            <p className="label">Savoir-faire</p>
            <h2 className="font-display text-4xl font-semibold uppercase leading-none md:text-5xl">Soudé à la main, testé au banc</h2>
            <p className="mt-4 leading-relaxed text-mute">
              Chaque ligne est cintrée et soudée TIG sous gaz neutre dans notre atelier, puis validée au banc de puissance et au sonomètre.
              Le titane grade 2 allège le train arrière et prend, à la chauffe, ses reflets bleu et or.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                ["−11,5 kg", "gain de poids max"],
                ["+28 ch", "gain de puissance max"],
                ["2 ans", "garantie soudures"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-display text-3xl font-semibold">{v}</dt>
                  <dd className="text-xs text-mute">{k}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Route / circuit */}
        <section className="mt-20 grid gap-5 md:grid-cols-2">
          <div className="rounded-md border border-line p-8">
            <span className="inline-block rounded-sm border border-legal/40 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-legal">Homologué route</span>
            <h3 className="mt-4 font-display text-3xl font-semibold uppercase">Pour tous les jours</h3>
            <p className="mt-2 text-mute">Conformes à la réglementation sonore, montage sur fixations d&apos;origine, valve pilotée sur certaines références.</p>
            <Link href="/boutique?usage=route" className="mt-5 inline-block text-sm font-semibold uppercase tracking-wide underline underline-offset-4">Gamme route →</Link>
          </div>
          <div className="relative isolate overflow-hidden rounded-md bg-ink p-8 text-white">
            <Photo src="/photos/ambiance-circuit.jpg" fallback={null} alt="" fill sizes="50vw" className="-z-10 object-cover opacity-40" />
            <span className="inline-block rounded-sm bg-rouge px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide">Circuit uniquement</span>
            <h3 className="mt-4 font-display text-3xl font-semibold uppercase">Pour le chrono</h3>
            <p className="mt-2 text-neutral-300">Lignes décatalysées et 4-en-1, sans compromis. Usage exclusif sur circuit fermé.</p>
            <Link href="/boutique?usage=circuit" className="mt-5 inline-block text-sm font-semibold uppercase tracking-wide underline underline-offset-4">Gamme circuit →</Link>
          </div>
        </section>

        {/* Avis */}
        {reviews && reviews.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-4xl font-semibold uppercase">Ils roulent en Ligne Rouge</h2>
            <p className="mt-1 text-xs text-mute">Avis de démonstration</p>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => {
                const prod = r.products as unknown as { name: string; slug: string } | null;
                return (
                  <figure key={r.id} className="rounded-md bg-cream p-6">
                    <Stars rating={r.rating} />
                    <blockquote className="mt-3 leading-relaxed">« {r.comment} »</blockquote>
                    <figcaption className="mt-4 text-sm text-mute">
                      {r.author_name} · <Link href={`/produit/${prod?.slug}`} className="font-medium text-ink underline-offset-2 hover:underline">{prod?.name}</Link>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {/* Réassurance */}
        <section className="mt-20 grid gap-6 border-y border-line py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["M3 7h11v8H3zM14 10h4l3 3v2h-7", "Livraison offerte", "dès 500 €, expédition 48 h"],
            ["M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Z", "Garantie 2 ans", "pièces et soudures"],
            ["M3 6h18v12H3zM3 10h18", "Paiement en 4x", "sans frais dès 300 €"],
            ["M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 8v4l3 2", "Conseil expert", "configurateur et SAV dédié"],
          ].map(([d, t, s]) => (
            <div key={t} className="flex items-center gap-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
                <path d={d} />
              </svg>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-mute">{s}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
