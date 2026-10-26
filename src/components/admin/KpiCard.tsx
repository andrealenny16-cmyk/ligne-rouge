export default function KpiCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-md p-5 ${accent ? "bg-heat" : "glass"}`}>
      <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.1em] ${accent ? "text-white/75" : "text-neutral-500"}`}>{label}</p>
      <p className="mt-2 font-display font-semibold text-4xl leading-none md:text-5xl">{value}</p>
      {sub && <p className={`mt-2 text-xs ${accent ? "text-white/75" : "text-neutral-500"}`}>{sub}</p>}
    </div>
  );
}
