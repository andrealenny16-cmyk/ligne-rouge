import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CIRCUIT_WARNING, type Usage } from "@/lib/types";

/* Composants de la charte — .claude/skills/ligne-rouge-design-system */

type PillProps = { children: ReactNode; variant?: "dark" | "heat"; plus?: boolean; className?: string };

function pillClass(variant: PillProps["variant"], className = "") {
  return `group inline-flex w-fit items-center gap-5 rounded-full py-1.5 pl-6 pr-1.5 font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
    variant === "heat" ? "bg-heat text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.6)]" : "bg-black/50 text-white hover:bg-black/70"
  } ${className}`;
}

function Plus() {
  return (
    <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-bronze pb-0.5 text-[1.4rem] font-black leading-none text-ink transition-transform duration-300 group-hover:rotate-90">
      +
    </span>
  );
}

export function PillLink({ href, children, variant = "dark", plus = true, className }: PillProps & { href: string }) {
  return (
    <Link href={href} className={pillClass(variant, className)}>
      {children}
      {plus && <Plus />}
    </Link>
  );
}

export function PillButton({
  children,
  variant = "dark",
  plus = true,
  className,
  ...rest
}: PillProps & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button {...rest} className={pillClass(variant, className)}>
      {children}
      {plus && <Plus />}
    </button>
  );
}

export function UsageBadge({ usage, className = "" }: { usage: Usage; className?: string }) {
  return usage === "route" ? (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-legal/40 bg-legal/10 px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-legal ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-legal" /> Homologué
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-alert/50 bg-alert/15 px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-[#ff5a66] ${className}`}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-alert" /> Circuit
    </span>
  );
}

export function CircuitWarning({ className = "" }: { className?: string }) {
  return (
    <div role="note" className={`flex gap-3 rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm text-white/90 ${className}`}>
      <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-alert text-xs font-black">!</span>
      <p>{CIRCUIT_WARNING}</p>
    </div>
  );
}

export function Gauge({ label, value, max, unit, display }: { label: string; value: number; max: number; unit: string; display?: string }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label !mb-0">{label}</span>
        <span className="font-mono text-sm font-semibold">
          {display ?? value} <span className="text-white/50">{unit}</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
        <div className="bg-heat absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%` }} />
        {[25, 50, 75].map((t) => (
          <span key={t} className="absolute inset-y-0 w-px bg-night/70" style={{ left: `${t}%` }} />
        ))}
      </div>
    </div>
  );
}

export function PageTitle({ kicker, title, accent, children }: { kicker?: string; title: string; accent?: string; children?: ReactNode }) {
  return (
    <div className="mb-10">
      {kicker && <p className="label">{kicker}</p>}
      <h1 className="font-display text-5xl uppercase leading-[0.9] md:text-7xl">
        {title} {accent && <span className="text-bronze">{accent}</span>}
      </h1>
      {children && <div className="mt-4 max-w-2xl text-white/60">{children}</div>}
    </div>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto max-w-7xl px-4 pb-10 pt-32 md:px-8 md:pt-40 ${className}`}>{children}</main>;
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-bronze" aria-label={`${rating} sur 5`}>
      {"★★★★★".slice(0, Math.round(rating))}
      <span className="text-white/20">{"★★★★★".slice(Math.round(rating))}</span>
    </span>
  );
}
