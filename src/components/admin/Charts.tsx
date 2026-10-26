"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const eur = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const tooltipStyle = {
  contentStyle: { background: "#121214", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, fontSize: 12 },
  labelStyle: { color: "rgba(255,255,255,0.6)" },
  itemStyle: { color: "#fff" },
};
const axis = { stroke: "rgba(255,255,255,0.35)", fontSize: 11, tickLine: false, axisLine: false };

export function RevenueChart({ data }: { data: { day: string; revenue: number; orders_count: number }[] }) {
  const rows = data.map((d) => ({ ...d, revenue: Number(d.revenue), label: new Date(d.day).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={rows} margin={{ left: 0, right: 8, top: 10 }}>
        <defs>
          <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3B82F6" />
            <stop offset="0.5" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#C08457" />
          </linearGradient>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8B5CF6" stopOpacity={0.35} />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" {...axis} interval={4} />
        <YAxis {...axis} width={56} tickFormatter={(v) => `${Math.round(v / 1000)} k€`} />
        <Tooltip {...tooltipStyle} formatter={(v, n) => (n === "revenue" ? [eur(Number(v)), "CA"] : [String(v), "Commandes"])} />
        <Area type="monotone" dataKey="revenue" stroke="url(#stroke)" strokeWidth={2.5} fill="url(#fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({ data }: { data: { name: string; revenue: number; units: number; usage: string }[] }) {
  const rows = data.map((d) => ({ ...d, revenue: Number(d.revenue) }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" {...axis} width={120} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v, _n, p) => [`${eur(Number(v))} · ${(p as { payload: { units: number } }).payload.units} u.`, "CA"]} />
        <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={18}>
          {rows.map((r) => (
            <Cell key={r.name} fill={r.usage === "circuit" ? "#E11D2E" : "#E8A36B"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function UsageDonut({ data }: { data: { usage: string; revenue: number; units: number }[] }) {
  const rows = data.map((d) => ({ ...d, revenue: Number(d.revenue) }));
  const total = rows.reduce((s, r) => s + r.revenue, 0) || 1;
  const COLORS: Record<string, string> = { route: "#3B82F6", circuit: "#E11D2E" };
  return (
    <div className="flex items-center gap-6">
      <div className="h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="revenue" nameKey="usage" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
              {rows.map((r) => (
                <Cell key={r.usage} fill={COLORS[r.usage]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v) => eur(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-3 text-sm">
        {rows.map((r) => (
          <li key={r.usage}>
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[r.usage] }} />
            <span className="capitalize">{r.usage === "route" ? "Homologué route" : "Circuit"}</span>
            <p className="font-display text-2xl">{Math.round((r.revenue / total) * 100)} %</p>
            <p className="text-xs text-white/45">{eur(r.revenue)} · {r.units} unités</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
