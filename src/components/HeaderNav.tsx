"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/boutique?type=voiture", label: "Voitures", type: "voiture" },
  { href: "/boutique?type=moto", label: "Motos", type: "moto" },
  { href: "/configurateur", label: "Configurateur" },
  { href: "/compte", label: "Compte" },
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
  const type = params.get("type");
  const active =
    LINKS.find((l) => (l.type ? path === "/boutique" && type === l.type : l.href === "/" ? path === "/" : path.startsWith(l.href)))
      ?.href ?? "";
  return <Bar {...props} active={active} />;
}

function Bar({ cartCount, loggedIn, isAdmin, active }: Props & { active: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[200] transition-all duration-300 ${
        scrolled ? "bg-night/70 backdrop-blur-xl border-b border-white/5 py-3" : "py-5 md:py-7"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 md:px-[4%]">
        <Link href="/" aria-label="DÉCIBEL Performance, accueil" className="shrink-0">
          <Logo />
        </Link>

        <nav className="glass-strong hidden gap-1 rounded-full p-1.5 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-5 py-2 font-nav text-[0.85rem] font-medium transition-all duration-300 ${
                active === l.href ? "bg-bronze text-ink" : "text-white/70 hover:bg-bronze hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={`rounded-full px-5 py-2 font-nav text-[0.85rem] font-medium transition-all ${
                path.startsWith("/admin") ? "bg-bronze text-ink" : "text-bronze hover:bg-bronze hover:text-ink"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={loggedIn ? "/compte" : "/connexion"}
            className="hidden rounded-full bg-black/50 px-6 py-3 text-[0.85rem] font-semibold transition hover:-translate-y-0.5 hover:bg-black/70 sm:block"
          >
            {loggedIn ? "Mon compte" : "Connexion"}
          </Link>
          <Link
            href="/panier"
            aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
            className="relative grid h-11 w-11 place-items-center rounded-full bg-black/50 transition hover:-translate-y-0.5 hover:bg-black/70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bronze px-1 text-[0.7rem] font-bold text-ink">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center rounded-full bg-black/50 lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 h-0.5 w-5 bg-white transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-0.5 w-5 bg-white transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="glass-strong mx-4 mt-3 flex flex-col gap-1 rounded-3xl p-2 lg:hidden">
          {[...LINKS, ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []), ...(!loggedIn ? [{ href: "/connexion", label: "Connexion" }] : [])].map(
            (l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-2xl px-5 py-3.5 font-nav text-base font-semibold ${
                  active === l.href ? "bg-bronze text-ink" : "text-white/85"
                }`}
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
