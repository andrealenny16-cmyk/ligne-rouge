export default function KpiCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 ${accent ? "bg-heat" : "glass"}`}>
      <p className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] ${accent ? "text-white/80" : "text-white/50"}`}>{label}</p>
      <p className="mt-2 font-display text-4xl leading-none md:text-5xl">{value}</p>
      {sub && <p className={`mt-2 text-xs ${accent ? "text-white/85" : "text-white/50"}`}>{sub}</p>}
    </div>
  );
}
