import Link from "next/link";
import { discountPercent, finalPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import Photo, { productPhoto } from "./Photo";
import { UsageBadge } from "./ui";

export function productImage(p: Product, position = 0) {
  return p.product_images?.find((i) => i.position === position)?.url ?? productPhoto(p.slug);
}

/** « Golf 8 GTI / S3 / Leon VZ » à partir de la table de compatibilité. */
export function compatLine(p: Product, max = 3) {
  const names = (p.product_compatibility ?? []).map((c) => c.vehicle_models.name);
  return names.slice(0, max).join(" / ") + (names.length > max ? " …" : "");
}

/* Carte « fiche technique » : photo sombre plein cadre, specs incrustées, prix dessous. */
export default function ProductCard({ product: p }: { product: Product }) {
  const off = discountPercent(p);
  return (
    <Link href={`/produit/${p.slug}`} className="group flex flex-col">
      <div className="photo relative isolate aspect-[5/4] overflow-hidden rounded-md text-white">
        <Photo
          src={productImage(p, 0)}
          alt={`${p.name}, échappement ${p.vehicle_type}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="-z-10 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/85 to-transparent" />

        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-neutral-300">
              Ligne Rouge · Échappement {p.vehicle_type}
            </p>
            <h3 className="mt-1 font-display text-3xl font-semibold uppercase leading-none">{p.name}</h3>
            <p className="mt-1 truncate text-[0.7rem] uppercase tracking-wide text-neutral-300">
              {compatLine(p)}
            </p>
          </div>
          {p.features.length > 0 && (
            <ul className="hidden shrink-0 space-y-0.5 border-l border-rouge pl-2.5 text-[0.6rem] font-medium uppercase leading-snug tracking-wide text-neutral-200 sm:block">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
              <li className="text-white">+{p.hp_gain} ch</li>
            </ul>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-white/15 px-4 py-2.5 text-[0.62rem] font-medium uppercase tracking-wide text-neutral-300">
          <span className="truncate">
            {p.categories?.name} · {p.db_level}
            {p.db_level_max ? `–${p.db_level_max}` : ""} dB
          </span>
          <span className="shrink-0">
            {p.tip_diameter_mm && `Ø ${p.tip_diameter_mm} mm · `}
            {p.material}
          </span>
        </div>

        {off > 0 && <span className="absolute right-4 top-4 rounded-sm bg-rouge px-2 py-0.5 text-xs font-semibold sm:hidden">−{off} %</span>}
      </div>

      <div className="flex items-start justify-between gap-4 pt-3">
        <div className="min-w-0">
          <UsageBadge usage={p.usage} />
          <p className="mt-1.5 line-clamp-1 text-sm text-mute">{p.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          {p.promo_price && (
            <div className="text-xs text-mute">
              <span className="line-through">{formatPrice(p.price)}</span> <span className="font-semibold text-rouge">−{off} %</span>
            </div>
          )}
          <div className={`text-lg font-semibold ${p.promo_price ? "text-rouge" : ""}`}>{formatPrice(finalPrice(p))}</div>
        </div>
      </div>
    </Link>
  );
}
