import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CIRCUIT_WARNING, type Usage } from "@/lib/types";

/* Composants de la charte — .claude/skills/ligne-rouge-design-system */

type PillProps = { children: ReactNode; variant?: "dark" | "heat" | "outline"; plus?: boolean; className?: string };

function btnClass(variant: PillProps["variant"], className = "") {
  const v =
    variant === "heat"
      ? "bg-rouge text-white hover:bg-rouge-dark"
      : variant === "outline"
        ? "border border-ink text-ink hover:bg-ink hover:text-white"
        : "bg-ink text-white hover:bg-neutral-800";
  return `inline-flex w-fit items-center justify-center gap-3 rounded-md px-6 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-40 ${v} ${className}`;
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PillLink({ href, children, variant = "dark", plus = false, className }: PillProps & { href: string }) {
  return (
    <Link href={href} className={btnClass(variant, className)}>
      {children}
      {plus && <Arrow />}
    </Link>
  );
}

export function PillButton({
  children,
  variant = "dark",
  plus = false,
  className,
  ...rest
}: PillProps & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button {...rest} className={btnClass(variant, className)}>
      {children}
      {plus && <Arrow />}
    </button>
  );
}

export function UsageBadge({ usage, className = "" }: { usage: Usage; className?: string }) {
  return usage === "route" ? (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border border-legal/40 bg-white px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-legal ${className}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="M5 12l5 5L19 7" /></svg>
      Homologué route
    </span>
  ) : (
    <span className={`inline-flex items-center rounded-sm bg-rouge px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-white ${className}`}>
      Circuit uniquement
    </span>
  );
}

export function CircuitWarning({ className = "" }: { className?: string }) {
  return (
    <div role="note" className={`flex gap-3 rounded-md border border-rouge/30 bg-rouge/5 p-4 text-sm text-ink ${className}`}>
      <svg className="mt-0.5 shrink-0 text-rouge" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3 2 21h20L12 3Z" /><path d="M12 10v5M12 18h.01" />
      </svg>
      <p>{CIRCUIT_WARNING}</p>
    </div>
  );
}

export function Gauge({ label, value, max, unit, display }: { label: string; value: number; max: number; unit: string; display?: string }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-mute">{label}</span>
        <span className="text-sm font-semibold">
          {display ?? value} <span className="font-normal text-mute">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PageTitle({ kicker, title, accent, children }: { kicker?: string; title: string; accent?: string; children?: ReactNode }) {
  return (
    <div className="mb-10">
      {kicker && <p className="label">{kicker}</p>}
      <h1 className="font-display text-4xl font-semibold uppercase leading-[0.95] md:text-6xl">
        {title} {accent && <span className="text-rouge">{accent}</span>}
      </h1>
      {children && <div className="mt-3 max-w-2xl text-mute">{children}</div>}
    </div>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-8 md:pt-14 ${className}`}>{children}</main>;
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="tracking-tight text-ink" aria-label={`${rating} sur 5`}>
      {"★★★★★".slice(0, Math.round(rating))}
      <span className="text-neutral-300">{"★★★★★".slice(Math.round(rating))}</span>
    </span>
  );
}
