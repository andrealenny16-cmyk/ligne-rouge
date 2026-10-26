import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfiguratorForm from "@/components/ConfiguratorForm";
import Photo from "@/components/Photo";
import ProductCard, { productImage } from "@/components/ProductCard";
import ViewTracker from "@/components/ViewTracker";
import BuyBox from "@/components/product/BuyBox";
import CompatChecker from "@/components/product/CompatChecker";
import ReviewForm from "@/components/product/ReviewForm";
import SoundButton from "@/components/SoundButton";
import { CircuitWarning, Gauge, Page, Stars, UsageBadge } from "@/components/ui";
import { formatDate, formatInstall } from "@/lib/format";
import { getSession } from "@/lib/supabase/server";
import { PRODUCT_SELECT, type Product } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ").toUpperCase() };
}

type CompatRow = { vehicle_models: { id: number; name: string; generation: string | null; year_from: number; year_to: number | null; vehicle_makes: { name: string } } };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, user } = await getSession();

  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data) notFound();
  const p = data as unknown as Product;

  const [{ data: compat }, { data: reviews }, fav, garage, { data: siblings }] = await Promise.all([
    supabase
      .from("product_compatibility")
      .select("vehicle_models(id, name, generation, year_from, year_to, vehicle_makes(name))")
      .eq("product_id", p.id),
    supabase.from("reviews").select("id, author_name, rating, comment, is_demo, created_at").eq("product_id", p.id).order("created_at", { ascending: false }),
    user ? supabase.from("favorites").select("product_id").eq("user_id", user.id).eq("product_id", p.id).maybeSingle() : Promise.resolve({ data: null }),
    user
      ? supabase.from("garage_vehicles").select("id, year, nickname, model_id, vehicle_models(name, vehicle_makes(name))").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
    supabase.from("products").select(PRODUCT_SELECT).eq("vehicle_type", p.vehicle_type).eq("is_active", true).neq("id", p.id).order("ref"),
  ]);
  const others = (siblings ?? []) as unknown as Product[];
  const typeLabel = p.vehicle_type === "moto" ? "Moto" : "Voiture";

  const vehicles = ((compat ?? []) as unknown as CompatRow[]).map((c) => c.vehicle_models);
  const avg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const garageList = ((garage.data ?? []) as unknown as { id: string; year: number; nickname: string | null; model_id: number; vehicle_models: { name: string; vehicle_makes: { name: string } } }[]).map((g) => ({
    id: g.id,
    model_id: g.model_id,
    label: `${g.nickname ? g.nickname + " · " : ""}${g.vehicle_models.vehicle_makes.name} ${g.vehicle_models.name} (${g.year})`,
  }));

  return (
    <Page>
      <ViewTracker productId={p.id} />
      <nav className="mb-6 font-mono text-xs uppercase tracking-wider text-neutral-400">
        <Link href="/" className="hover:text-bronze">Accueil</Link> /{" "}
        <Link href={`/#${p.vehicle_type}`} className="hover:text-bronze">Échappements {typeLabel}</Link> / <span className="text-neutral-600">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        {/* Une seule photo, la plus nette : le pot sur fond studio */}
        <div className="photo relative aspect-[5/4] self-start overflow-hidden rounded-md bg-[#111113]">
          <Photo src={productImage(p)} alt={`${p.name}, échappement ${typeLabel.toLowerCase()} LIGNE ROUGE`} fill priority quality={95} sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain" />
        </div>

        <div>
          <Link
            href={`/#${p.vehicle_type}`}
            className="mb-4 inline-flex items-center gap-2.5 rounded-full bg-night py-1.5 pl-1.5 pr-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-bronze text-ink" aria-hidden>
              {p.vehicle_type === "moto" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M5 17h4l3-6h4l3 6M12 11 10 7H7" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 15v-3l2-5h14l2 5v3H3Z" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></svg>
              )}
            </span>
            Échappement {typeLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <UsageBadge usage={p.usage} />
            <span className="font-mono text-xs tracking-wider text-neutral-500">REF. {p.ref}</span>
            <span className="font-mono text-xs text-neutral-500">· {p.categories?.name}</span>
          </div>
          <h1 className="mt-3 font-display text-6xl uppercase italic leading-[0.85] md:text-8xl">{p.name}</h1>
          <p className="mt-2 text-neutral-600">{p.tagline}</p>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/[0.04] sm:grid-cols-4">
            {[
              ["Sortie", p.tip_diameter_mm ? `Ø ${p.tip_diameter_mm} mm` : "—"],
              ["Matériau", p.material.charAt(0).toUpperCase() + p.material.slice(1)],
              ["Puissance", `+${p.hp_gain} ch`],
              ["Niveau", `${p.db_level}${p.db_level_max ? `–${p.db_level_max}` : ""} dB`],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-3 py-2.5">
                <dt className="font-mono text-[0.6rem] uppercase tracking-widest text-neutral-400">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {p.features.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.features.map((f) => (
                <li key={f} className="border-l-2 border-rouge bg-black/[0.04] px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-neutral-700">{f}</li>
              ))}
            </ul>
          )}
          {reviews?.length ? (
            <a href="#avis" className="mt-3 inline-flex items-center gap-2 text-sm">
              <Stars rating={avg} /> <span className="text-neutral-500">{avg.toFixed(1)} · {reviews.length} avis</span>
            </a>
          ) : null}

          <SoundButton vehicle={p.vehicle_type} usage={p.usage} className="mt-5 text-night" />

          <BuyBox product={p} loggedIn={!!user} isFavorite={!!fav.data} />

          {p.usage === "circuit" && <CircuitWarning className="mt-5" />}

          <div className="glass mt-6 space-y-5 rounded-3xl p-6">
            <Gauge
              label="Niveau sonore"
              value={p.db_level_max ?? p.db_level}
              max={120}
              unit="dB"
              display={p.db_level_max ? `${p.db_level}–${p.db_level_max}` : String(p.db_level)}
            />
            <Gauge label="Gain de puissance" value={p.hp_gain} max={30} unit="ch" display={`+${p.hp_gain}`} />
            {p.torque_gain > 0 && <Gauge label="Gain de couple" value={p.torque_gain} max={40} unit="Nm" display={`+${p.torque_gain}`} />}
            <Gauge label="Poids gagné" value={Number(p.weight_saving_kg)} max={12} unit="kg" display={`−${p.weight_saving_kg}`} />
            <div className="cote" />
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Montage", formatInstall(p.install_minutes)],
                ["Matériau", p.material],
                ["Stock", p.stock > 0 ? `${p.stock} dispo` : "Rupture"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="label !mb-1">{k}</p>
                  <p className="font-semibold capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl uppercase">Le son, <span className="text-bronze">en mots</span></h2>
          <p className="mt-4 leading-relaxed text-neutral-700">{p.description}</p>

          <h3 className="mt-10 font-display text-3xl uppercase">Véhicules compatibles</h3>
          <ul className="mt-4 divide-y divide-black/10 rounded-3xl border border-black/10">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-center justify-between px-5 py-3.5">
                <span>
                  {v.vehicle_makes.name} <span className="font-semibold">{v.name}</span>{" "}
                  {v.generation && <span className="font-mono text-xs text-neutral-400">{v.generation}</span>}
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  {v.year_from}–{v.year_to ?? "auj."}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <CompatChecker productId={p.id} compatibleIds={vehicles.map((v) => v.id)} garage={garageList} vehicleType={p.vehicle_type} />
          <div className="glass rounded-3xl p-6">
            <p className="label">Configurateur Son & Perf</p>
            <p className="mb-4 font-display text-2xl uppercase">Un doute ? Demande à l&apos;IA</p>
            <ConfiguratorForm compact />
          </div>
        </div>
      </section>

      <section id="avis" className="mt-16">
        <h2 className="font-display text-4xl uppercase">Avis <span className="text-bronze">pilotes</span></h2>
        <p className="mt-1 font-mono text-[0.65rem] tracking-wider text-neutral-400">AVIS MARQUÉS « DÉMO » : DONNÉES FICTIVES DE DÉMONSTRATION</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(reviews ?? []).map((r) => (
            <article key={r.id} className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.author_name}</span>
                <Stars rating={r.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{r.comment}</p>
              <p className="mt-4 font-mono text-[0.65rem] text-neutral-400">
                {formatDate(r.created_at)} {r.is_demo && "· DÉMO"}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-6 max-w-xl">
          {user ? <ReviewForm productId={p.id} slug={p.slug} /> : (
            <p className="text-sm text-neutral-500">
              <Link href={`/connexion?next=/produit/${p.slug}`} className="text-bronze underline">Connecte-toi</Link> pour laisser un avis.
            </p>
          )}
        </div>
      </section>
      {others.length > 0 && (
        <section className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-4xl uppercase italic leading-none md:text-5xl">
              Les autres pots <span className="text-heat">{typeLabel}</span>
            </h2>
            <Link href={`/#${p.vehicle_type}`} className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 hover:text-night">
              Tout l&apos;univers {typeLabel} →
            </Link>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <ProductCard key={o.id} product={o} />
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
