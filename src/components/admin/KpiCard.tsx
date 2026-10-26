export default function KpiCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`min-w-0 rounded-3xl p-5 ${accent ? "bg-heat" : "glass"}`}>
      <p className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] ${accent ? "text-white/80" : "text-neutral-500"}`}>{label}</p>
      <p className="mt-2 whitespace-nowrap font-display text-[clamp(1.6rem,2.4vw,2.6rem)] leading-none">{value}</p>
      {sub && <p className={`mt-2 text-xs ${accent ? "text-white/80" : "text-neutral-500"}`}>{sub}</p>}
    </div>
  );
}
