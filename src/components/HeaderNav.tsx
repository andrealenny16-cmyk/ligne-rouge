"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Logo from "./Logo";

const LINKS = [
  { href: "/boutique?type=voiture", label: "Voitures", type: "voiture" },
  { href: "/boutique?type=moto", label: "Motos", type: "moto" },
  { href: "/boutique?usage=circuit", label: "Gamme circuit", usage: "circuit" },
  { href: "/configurateur", label: "Conseil sur mesure" },
];

type Props = { cartCount: number; loggedIn: boolean; isAdmin: boolean };

export default function HeaderNav(props: Props) {
  return (
    <Suspense fallback={<Bar {...props} active="" />}>
      <WithParams {...props} />
    </Suspense>
  );
}

function WithParams(props: Props) {
  const path = usePathname();
  const params = useSearchParams();
  const active =
    LINKS.find((l) =>
      l.type ? path === "/boutique" && params.get("type") === l.type : l.usage ? path === "/boutique" && params.get("usage") === l.usage : path.startsWith(l.href),
    )?.href ?? "";
  return <Bar {...props} active={active} />;
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Bar({ cartCount, loggedIn, isAdmin, active }: Props & { active: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="sticky top-0 z-[200]">
      <div className="bg-ink px-4 py-2 text-center text-[0.72rem] font-medium tracking-wide text-white">
        Livraison offerte dès 500 € <span className="mx-2 text-neutral-500">·</span> Garantie 2 ans{" "}
        <span className="mx-2 hidden text-neutral-500 sm:inline">·</span>
        <span className="hidden sm:inline">Paiement en 4x sans frais</span>
      </div>
      <div className="border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
          <Link href="/" aria-label="LIGNE ROUGE, accueil" className="shrink-0">
            <Logo className="h-11" />
          </Link>

          <nav className="hidden h-full items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex h-full items-center text-sm font-semibold uppercase tracking-wide transition-colors ${
                  active === l.href ? "text-rouge" : "text-ink hover:text-rouge"
                }`}
              >
                {l.label}
                {active === l.href && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-rouge" />}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className={`text-sm font-semibold uppercase tracking-wide ${path.startsWith("/admin") ? "text-rouge" : "text-mute hover:text-ink"}`}>
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={loggedIn ? "/compte" : "/connexion"}
              aria-label={loggedIn ? "Mon compte" : "Connexion"}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-cream"
            >
              <Icon d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
              <span className="hidden md:inline">{loggedIn ? "Mon compte" : "Connexion"}</span>
            </Link>
            <Link href="/panier" aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`} className="relative rounded-md px-3 py-2 hover:bg-cream">
              <Icon d="M6 7h12l-1 13H7L6 7ZM9 7V5a3 3 0 0 1 6 0v2" />
              {cartCount > 0 && (
                <span className="absolute right-1 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-md bg-rouge px-1 text-[0.65rem] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} className="rounded-md px-3 py-2 hover:bg-cream lg:hidden">
              <Icon d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav className="border-b border-line bg-white px-4 pb-4 lg:hidden">
          {[...LINKS, ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [])].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block border-b border-line py-3.5 text-sm font-semibold uppercase tracking-wide ${active === l.href ? "text-rouge" : "text-ink"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
