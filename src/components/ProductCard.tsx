import Image from "next/image";
import Link from "next/link";
import { discountPercent, finalPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { UsageBadge } from "./ui";

export function productImage(p: Product, position = 0) {
  return p.product_images?.find((i) => i.position === position)?.url ?? `/products/${p.slug}-34.svg`;
}

export default function ProductCard({ product: p }: { product: Product }) {
  const off = discountPercent(p);
  return (
    <Link
      href={`/produit/${p.slug}`}
      className="glass sheen group flex flex-col rounded-[28px] p-3 transition-all duration-400 ease-pop hover:border-white/30 hover:bg-white/[0.08]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-paper">
        <Image
          src={productImage(p)}
          alt={`${p.name} — vue 3/4`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-3 group-hover:-rotate-6 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <UsageBadge usage={p.usage} className="!bg-night/80 backdrop-blur" />
        </div>
        {off > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-alert px-2.5 py-1 font-mono text-xs font-bold">−{off} %</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2 pb-2 pt-4">
        <span className="font-mono text-[0.68rem] tracking-wider text-white/45">REF. {p.ref}</span>
        <h3 className="font-display text-3xl uppercase leading-none">{p.name}</h3>
        <p className="line-clamp-1 text-sm text-white/55">{p.tagline}</p>
        <div className="mt-3 flex items-end justify-between">
          <div className="flex gap-3 font-mono text-xs text-white/60">
            <span>+{p.hp_gain} ch</span>
            <span>{p.db_level} dB</span>
            <span>−{p.weight_saving_kg} kg</span>
          </div>
          <div className="text-right">
            {p.promo_price && <div className="text-xs text-white/40 line-through">{formatPrice(p.price)}</div>}
            <div className="text-lg font-bold text-bronze">{formatPrice(finalPrice(p))}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
