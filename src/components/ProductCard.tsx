import Link from "next/link";
import { discountPercent, finalPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import Photo, { productPhoto } from "./Photo";
import { UsageBadge } from "./ui";

export function productImage(p: Product, position = 0) {
  return p.product_images?.find((i) => i.position === position)?.url ?? productPhoto(p.slug);
}

export default function ProductCard({ product: p }: { product: Product }) {
  const off = discountPercent(p);
  return (
    <Link href={`/produit/${p.slug}`} className="group flex flex-col">
      <div className="photo relative aspect-[4/3] overflow-hidden rounded-md">
        <Photo src={productImage(p, 0)} alt={`${p.name}, vue 3/4`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-opacity duration-300 group-hover:opacity-0" />
        <Photo src={productImage(p, 1)} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-3 top-3">
          <UsageBadge usage={p.usage} />
        </div>
        {off > 0 && <span className="absolute right-3 top-3 rounded-sm bg-ink px-2 py-0.5 text-xs font-semibold text-white">−{off} %</span>}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <span className="text-[0.7rem] font-medium uppercase tracking-wider text-mute">
          {p.categories?.name} · {p.material}
        </span>
        <h3 className="mt-1 font-display text-2xl font-semibold uppercase leading-none group-hover:text-rouge">{p.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-mute">{p.tagline}</p>
        <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
          <div className="flex gap-4 text-xs text-mute">
            <span><b className="font-semibold text-ink">+{p.hp_gain}</b> ch</span>
            <span><b className="font-semibold text-ink">{p.db_level}</b> dB</span>
            <span><b className="font-semibold text-ink">−{p.weight_saving_kg}</b> kg</span>
          </div>
          <div className="text-right">
            {p.promo_price && <div className="text-xs text-mute line-through">{formatPrice(p.price)}</div>}
            <div className={`text-lg font-semibold ${p.promo_price ? "text-rouge" : ""}`}>{formatPrice(finalPrice(p))}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
