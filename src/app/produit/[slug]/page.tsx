import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfiguratorForm from "@/components/ConfiguratorForm";
import SoundButton from "@/components/SoundButton";
import ViewTracker from "@/components/ViewTracker";
import BuyBox from "@/components/product/BuyBox";
import CompatChecker from "@/components/product/CompatChecker";
import Gallery from "@/components/product/Gallery";
import ReviewForm from "@/components/product/ReviewForm";
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

  const [{ data: compat }, { data: reviews }, fav, garage] = await Promise.all([
    supabase
      .from("product_compatibility")
      .select("vehicle_models(id, name, generation, year_from, year_to, vehicle_makes(name))")
      .eq("product_id", p.id),
    supabase.from("reviews").select("id, author_name, rating, comment, is_demo, created_at").eq("product_id", p.id).order("created_at", { ascending: false }),
    user ? supabase.from("favorites").select("product_id").eq("user_id", user.id).eq("product_id", p.id).maybeSingle() : Promise.resolve({ data: null }),
    user
      ? supabase.from("garage_vehicles").select("id, year, nickname, model_id, vehicle_models(name, vehicle_makes(name))").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const vehicles = ((compat ?? []) as unknown as CompatRow[]).map((c) => c.vehicle_models);
  const avg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const images = [...(p.product_images ?? [])].sort((a, b) => a.position - b.position);
  const garageList = ((garage.data ?? []) as unknown as { id: string; year: number; nickname: string | null; model_id: number; vehicle_models: { name: string; vehicle_makes: { name: string } } }[]).map((g) => ({
    id: g.id,
    model_id: g.model_id,
    label: `${g.nickname ? g.nickname + " · " : ""}${g.vehicle_models.vehicle_makes.name} ${g.vehicle_models.name} (${g.year})`,
  }));

  return (
    <Page>
      <ViewTracker productId={p.id} />
      <nav className="mb-6 font-mono text-xs text-neutral-400">
        <Link href="/boutique" className="hover:text-rouge">Boutique</Link> /{" "}
        <Link href={`/boutique?type=${p.vehicle_type}`} className="capitalize hover:text-rouge">{p.vehicle_type}s</Link> / {p.name}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <Gallery images={images} name={p.name} />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <UsageBadge usage={p.usage} />
            <span className="font-mono text-xs tracking-wider text-neutral-500">REF. {p.ref}</span>
            <span className="font-mono text-xs text-neutral-500">· {p.categories?.name}</span>
          </div>
          <h1 className="mt-3 font-display font-semibold text-5xl uppercase leading-[0.95] md:text-6xl">{p.name}</h1>
          <p className="mt-2 text-neutral-600">{p.tagline}</p>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line text-sm sm:grid-cols-4">
            {[
              ["Sortie", p.tip_diameter_mm ? `Ø ${p.tip_diameter_mm} mm` : "—"],
              ["Matériau", p.material],
              ["Puissance", `+${p.hp_gain} ch`],
              ["Niveau", `${p.db_level}${p.db_level_max ? `–${p.db_level_max}` : ""} dB`],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-3 py-2.5">
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-mute">{k}</dt>
                <dd className="font-semibold capitalize">{v}</dd>
              </div>
            ))}
          </dl>
          {p.features.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.features.map((f) => (
                <li key={f} className="rounded-sm bg-cream px-2.5 py-1 text-xs font-medium">{f}</li>
              ))}
            </ul>
          )}
          {reviews?.length ? (
            <a href="#avis" className="mt-3 inline-flex items-center gap-2 text-sm">
              <Stars rating={avg} /> <span className="text-neutral-500">{avg.toFixed(1)} · {reviews.length} avis</span>
            </a>
          ) : null}

          <div className="mt-6">
            <SoundButton usage={p.usage} />
          </div>

          <BuyBox product={p} loggedIn={!!user} isFavorite={!!fav.data} />

          {p.usage === "circuit" && <CircuitWarning className="mt-5" />}

          <div className="glass mt-6 space-y-5 rounded-md p-6">
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
          <h2 className="font-display font-semibold text-4xl uppercase">Le son, <span className="text-rouge">en mots</span></h2>
          <p className="mt-4 leading-relaxed text-neutral-700">{p.description}</p>

          <h3 className="mt-10 font-display font-semibold text-3xl uppercase">Véhicules compatibles</h3>
          <ul className="mt-4 divide-y divide-line rounded-md border border-line">
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
          <div className="glass rounded-md p-6">
            <p className="label">Configurateur Son & Perf</p>
            <p className="mb-4 font-display font-semibold text-2xl uppercase">Un doute ? Demande à l&apos;IA</p>
            <ConfiguratorForm compact />
          </div>
        </div>
      </section>

      <section id="avis" className="mt-16">
        <h2 className="font-display font-semibold text-4xl uppercase">Avis <span className="text-rouge">pilotes</span></h2>
        <p className="mt-1 font-mono text-[0.65rem] tracking-wider text-neutral-400">AVIS MARQUÉS « DÉMO » : DONNÉES FICTIVES DE DÉMONSTRATION</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(reviews ?? []).map((r) => (
            <article key={r.id} className="glass rounded-md p-5">
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
              <Link href={`/connexion?next=/produit/${p.slug}`} className="text-rouge underline">Connecte-toi</Link> pour laisser un avis.
            </p>
          )}
        </div>
      </section>
    </Page>
  );
}
