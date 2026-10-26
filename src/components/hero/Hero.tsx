"use client";

import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import SoundButton from "@/components/SoundButton";
import { PillLink } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { SOUND_EVENT } from "@/lib/sound";
import { buildExhaust, buildPart, makeRenderer, materials, partMaterial, type Finish, type PartKind } from "./scene";

/* Hero LIGNE ROUGE — transposition de la référence « Soda » :
   fond radial, pot 3D qui suit le curseur, quincaillerie repoussée par la souris,
   étincelles qui montent, cartes de gamme qui déclenchent la chorégraphie GSAP. */

const THEMES: Record<Finish, { inner: string; mid: string; outer: string }> = {
  route: { inner: "#1E3A8A", mid: "#0B1630", outer: "#03060F" },
  circuit: { inner: "#8A1E0B", mid: "#3A0A04", outer: "#0F0302" },
};

type Layer = "front" | "back" | "far";
type PartDef = { kind: PartKind; top: number; left: number; size: number; layer: Layer; opacity?: number; mobile?: boolean };

// Positions et tailles reprises des .b1…b9 / .l1…l4 de la référence
const PARTS: PartDef[] = [
  { kind: "nut", top: 25, left: 30, size: 220, layer: "front", mobile: true },
  { kind: "bolt", top: 60, left: 42, size: 100, layer: "front" },
  { kind: "clamp", top: 30, left: 62, size: 250, layer: "front", mobile: true },
  { kind: "washer", top: 15, left: 48, size: 140, layer: "front" },
  { kind: "bolt", top: 75, left: 20, size: 120, layer: "front" },
  { kind: "nut", top: 45, left: 75, size: 180, layer: "front", mobile: true },
  { kind: "nut", top: 15, left: 40, size: 80, layer: "back", opacity: 0.7, mobile: true },
  { kind: "washer", top: 50, left: 55, size: 70, layer: "back", opacity: 0.6, mobile: true },
  { kind: "bolt", top: 80, left: 35, size: 75, layer: "back", opacity: 0.7 },
  { kind: "clamp", top: 10, left: 15, size: 60, layer: "far" },
  { kind: "clamp", top: 40, left: 80, size: 140, layer: "far", opacity: 0.4 },
  { kind: "nut", top: 70, left: 75, size: 80, layer: "far" },
  { kind: "washer", top: 85, left: 20, size: 120, layer: "far", opacity: 0.3 },
];
const DURS = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10];
const PARALLAX: Record<Layer, number> = { front: 60, back: -30, far: -15 };

type Api = { switchTo: (f: Finish) => void };

export default function Hero({ routeFrom, circuitFrom }: { routeFrom: number; circuitFrom: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const potRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const embersRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [mode, setMode] = useState<Finish>("route");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const section = sectionRef.current!;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pr = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    let W = section.clientWidth;
    let H = section.clientHeight;

    // --- Pot (perspective) ---
    const pot = makeRenderer(potRef.current!, pr);
    const mats = materials(pot.envMap);
    const potScene = new THREE.Scene();
    const potCam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(4, 6, 8);
    const rim = new THREE.DirectionalLight("#E8A36B", 2.5);
    rim.position.set(-6, -2, -4);
    potScene.add(key, rim, new THREE.AmbientLight("#ffffff", 0.25));
    const exhaust = buildExhaust(mats);
    const potRoot = new THREE.Group(); // inclinaison fixe (rotate 25deg de la référence)
    const potTilt = new THREE.Group(); // suit le curseur + spin
    potTilt.add(exhaust.root);
    potRoot.add(potTilt);
    potRoot.rotation.z = THREE.MathUtils.degToRad(18);
    potScene.add(potRoot);

    const fitCamera = () => {
      const aspect = W / H;
      const span = 7.4 / (isMobile ? 0.95 : 0.6); // largeur de scène visible souhaitée
      potCam.aspect = aspect;
      potCam.position.z = Math.max(10, span / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * aspect));
      potCam.updateProjectionMatrix();
    };
    fitCamera();

    // --- Quincaillerie (orthographique, unités = pixels) ---
    const back = makeRenderer(backRef.current!, pr);
    const front = makeRenderer(frontRef.current!, pr);
    const makeOrtho = () => new THREE.OrthographicCamera(0, W, 0, -H, -2000, 2000);
    const backCam = makeOrtho();
    const frontCam = makeOrtho();
    const backScene = new THREE.Scene();
    const frontScene = new THREE.Scene();
    for (const s of [backScene, frontScene]) {
      const l = new THREE.DirectionalLight("#ffffff", 2);
      l.position.set(300, 500, 800);
      const r = new THREE.DirectionalLight("#E8A36B", 1.5);
      r.position.set(-400, -300, 200);
      s.add(l, r, new THREE.AmbientLight("#ffffff", 0.3));
    }

    const defs = PARTS.filter((p) => !isMobile || p.mobile);
    const parts = defs.map((d, i) => {
      const env = d.layer === "front" ? front.envMap : back.envMap;
      const mat = partMaterial(env, "route", d.opacity ?? 1);
      const group = buildPart(d.kind, mat);
      const holder = new THREE.Group();
      holder.add(group);
      (d.layer === "front" ? frontScene : backScene).add(holder);
      const size = isMobile ? d.size * 0.55 : d.size;
      return {
        d,
        i,
        size,
        holder,
        group,
        mat,
        env,
        rx: 0,
        ry: 0,
        angle: Math.random() * 360,
        baseX: 0,
        baseY: 0,
        tx: Math.random() * Math.PI,
        ty: Math.random() * Math.PI,
        sw: { x: 0, y: 0, scale: 1, opacity: d.opacity ?? 1, rot: 0 },
      };
    });

    const setPartFinish = (f: Finish) => {
      parts.forEach((p) => {
        const m = partMaterial(p.env, f, p.d.opacity ?? 1);
        m.opacity = p.mat.opacity;
        p.group.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = m;
        });
        p.mat.dispose();
        p.mat = m;
      });
    };

    // --- Interactions ---
    const mouse = { x: 0, y: 0, px: -9999, py: -9999 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      const r = section.getBoundingClientRect();
      mouse.px = e.clientX - r.left;
      mouse.py = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let switching = false;
    let switchSpin = 0;
    let soundOn = false;
    let finish: Finish = "route";

    const onSound = (e: Event) => {
      soundOn = (e as CustomEvent).detail.playing;
      restartEmbers();
    };
    window.addEventListener(SOUND_EVENT, onSound);

    apiRef.current = {
      switchTo(next) {
        if (switching || next === finish) return;
        switching = true;
        setBusy(true);
        finish = next;

        // 1. Fond
        const c = THEMES[next];
        gsap.to(section, { "--bg-inner": c.inner, "--bg-mid": c.mid, "--bg-outer": c.outer, duration: 1.5, ease: "power2.inOut" });

        // 2. Spin 720° + flou, changement de matériau au pic
        const spin = { val: 0, blur: 0 };
        const potEl = potRef.current!;
        gsap.to(spin, {
          val: 360,
          blur: 15,
          duration: 0.6,
          ease: "power2.in",
          onUpdate: () => {
            switchSpin = spin.val;
            potEl.style.filter = `blur(${spin.blur}px)`;
          },
          onComplete: () => {
            const m = next === "circuit" ? mats.bleu : mats.titane;
            exhaust.body.material = m;
            exhaust.cone.material = m;
            gsap.to(spin, {
              val: 720,
              blur: 0,
              duration: 1.5,
              ease: "back.out(0.7)",
              onUpdate: () => {
                switchSpin = spin.val;
                potEl.style.filter = `blur(${spin.blur}px)`;
              },
              onComplete: () => {
                switchSpin = 0;
                potEl.style.filter = "none";
              },
            });
          },
        });

        // 3. Implosion vers le centre puis explosion vers de nouvelles positions
        let done = 0;
        parts.forEach((p) => {
          const bx = (p.d.left / 100) * W + p.size / 2;
          const by = (p.d.top / 100) * H + p.size / 2;
          const nx = (Math.random() - 0.5) * 200;
          const ny = (Math.random() - 0.5) * 200;
          Object.assign(p.sw, { x: p.baseX + p.rx, y: p.baseY + p.ry, scale: 1, opacity: p.d.opacity ?? 1, rot: p.angle });
          gsap
            .timeline()
            .to(p.sw, {
              x: W / 2 - bx,
              y: H / 2 - by,
              rot: p.angle + 45,
              scale: 0.1,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in",
              onComplete: () => {
                if (p.i === 0) setPartFinish(next);
                potEl.style.zIndex = "50";
              },
            })
            .to(p.sw, { duration: 0.3 })
            .to(p.sw, {
              onStart: () => {
                potEl.style.zIndex = "1";
              },
              x: nx,
              y: ny,
              rot: p.angle + 90,
              scale: 1,
              opacity: p.d.opacity ?? 1,
              duration: 0.9,
              ease: "back.out(1.5)",
              onComplete: () => {
                p.angle += 90;
                p.baseX = nx;
                p.baseY = ny;
                p.rx = 0;
                p.ry = 0;
                if (++done === parts.length) {
                  switching = false;
                  setBusy(false);
                }
              },
            });
        });
      },
    };

    // --- Boucle d'animation ---
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(section);
    const pxToWorld = 5.36 / H; // approx. pour le flottement ±20 px

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const time = performance.now() * 0.001;
      cur.x += (mouse.x - cur.x) * 0.05;
      cur.y += (mouse.y - cur.y) * 0.05;

      // Pot : inclinaison vers le curseur + flottement + vibration pendant le son
      const shake = soundOn ? 0.025 : 0;
      potTilt.rotation.y = THREE.MathUtils.degToRad(cur.x * 40 + switchSpin);
      potTilt.rotation.x = THREE.MathUtils.degToRad(cur.y * 20);
      potRoot.position.y = (reduced ? 0 : Math.sin((time * Math.PI * 2) / 6) * 20 * pxToWorld * (potCam.position.z / 10)) + (Math.random() - 0.5) * shake * 4;
      potRoot.position.x = (Math.random() - 0.5) * shake * 4;
      pot.renderer.render(potScene, potCam);

      parts.forEach((p) => {
        const par = PARALLAX[p.d.layer];
        const ox = cur.x * par;
        const oy = cur.y * par;
        const bx = (p.d.left / 100) * W + p.size / 2 + ox;
        const by = (p.d.top / 100) * H + p.size / 2 + oy;
        let sx: number, sy: number, rot: number, scale: number;

        if (switching) {
          sx = bx + p.sw.x;
          sy = by + p.sw.y;
          rot = p.sw.rot;
          scale = p.sw.scale;
          p.mat.opacity = p.sw.opacity;
        } else {
          let trx = 0,
            tr_y = 0,
            speed = 1;
          if (!isMobile) {
            const dx = mouse.px - (bx + p.rx + p.baseX);
            const dy = mouse.py - (by + p.ry + p.baseY);
            const dist = Math.hypot(dx, dy);
            if (dist < 400 && dist > 0) {
              const force = (400 - dist) / 400;
              trx = (dx / dist) * force * -80;
              tr_y = (dy / dist) * force * -80;
              speed = 1 + force * 5;
            }
          }
          p.rx += (trx - p.rx) * 0.1;
          p.ry += (tr_y - p.ry) * 0.1;
          p.angle += 0.2 * speed * (soundOn ? 2.5 : 1);
          const dur = p.d.layer === "far" ? 10 + p.i * 2 : DURS[p.i % 9];
          const phase = (time + p.i * 0.7) * ((Math.PI * 2) / dur);
          const floatY = reduced ? 0 : Math.sin(phase) * (p.d.layer === "far" ? 20 : 15);
          sx = bx + p.rx + p.baseX;
          sy = by + p.ry + p.baseY + floatY;
          rot = p.angle + Math.cos(phase) * 6;
          scale = 1;
          p.tx += 0.004 * speed;
          p.ty += 0.006 * speed;
        }
        p.holder.position.set(sx, -sy, 0);
        p.holder.rotation.z = THREE.MathUtils.degToRad(-rot);
        p.group.rotation.set(p.tx, p.ty, 0);
        p.holder.scale.setScalar(p.size * 0.32 * scale);
      });
      back.renderer.render(backScene, backCam);
      front.renderer.render(frontScene, frontCam);
    };

    const resize = () => {
      W = section.clientWidth;
      H = section.clientHeight;
      for (const r of [pot.renderer, back.renderer, front.renderer]) r.setSize(W, H, false);
      fitCamera();
      for (const c of [backCam, frontCam]) {
        c.right = W;
        c.bottom = -H;
        c.updateProjectionMatrix();
      }
    };
    resize();
    window.addEventListener("resize", resize);
    tick();

    // --- Étincelles et braises ---
    const embers = embersRef.current!;
    let emberTimer = 0;
    const spawn = () => {
      const s = document.createElement("span");
      const blue = Math.random() < (finish === "route" ? 0.45 : 0.15);
      const color = blue ? "#6EA8FF" : Math.random() < 0.5 ? "#FF8A3D" : "#FFC27A";
      const size = Math.random() * 4 + 2;
      const dur = Math.random() * 5 + 4;
      s.style.cssText = `position:absolute;bottom:-10px;left:${Math.random() * 100}%;width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 ${size * 3}px ${size}px ${color}88;--drift:${(Math.random() - 0.5) * 80}px;animation:rise ${soundOn ? dur * 0.45 : dur}s linear forwards, flicker ${0.2 + Math.random() * 0.4}s ease-in-out infinite;pointer-events:none;`;
      embers.appendChild(s);
      window.setTimeout(() => s.remove(), dur * 1000);
    };
    const restartEmbers = () => {
      window.clearInterval(emberTimer);
      if (reduced) return;
      emberTimer = window.setInterval(spawn, soundOn ? 60 : isMobile ? 700 : 400);
    };
    restartEmbers();

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(emberTimer);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      window.removeEventListener(SOUND_EVENT, onSound);
      gsap.killTweensOf(section);
      [pot, back, front].forEach((r) => r.renderer.dispose());
      apiRef.current = null;
    };
  }, []);

  const choose = (f: Finish) => {
    if (busy || f === mode) return;
    setMode(f);
    apiRef.current?.switchTo(f);
  };

  const cards: { f: Finish; title: string; img: string; from: number }[] = [
    { f: "route", title: "Homologué route", img: "/products/titan-gt-cut.svg", from: routeFrom },
    { f: "circuit", title: "Circuit", img: "/products/inferno-r-cut.svg", from: circuitFrom },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] min-h-[640px] overflow-hidden"
      style={
        {
          "--bg-inner": THEMES.route.inner,
          "--bg-mid": THEMES.route.mid,
          "--bg-outer": THEMES.route.outer,
          background: "radial-gradient(circle at center, var(--bg-inner) 0%, var(--bg-mid) 50%, var(--bg-outer) 100%)",
        } as React.CSSProperties
      }
    >
      {/* Texture carbone discrète sur tout le hero */}
      <div className="carbon pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay" />

      <canvas ref={backRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full" aria-hidden />
      <canvas ref={potRef} className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-0 [animation:fadeIn_1.5s_ease-out_0.3s_forwards]" aria-hidden />

      {/* Étincelles + fumée */}
      <div ref={embersRef} className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="absolute bottom-[-12vh] h-[38vh] w-[38vh] rounded-full"
            style={
              {
                left: `${i * 18 - 5}%`,
                background: "radial-gradient(circle, rgba(200,200,210,0.35) 0%, transparent 65%)",
                filter: "blur(18px)",
                "--drift": `${(i % 2 ? 1 : -1) * 60}px`,
                animation: `smoke ${9 + i * 1.3}s ease-out ${i * 1.4}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative z-[100] mx-auto flex h-full max-w-[1600px] flex-col justify-between px-4 pb-6 pt-24 md:flex-row md:px-[4%] md:pb-0 md:pt-20 pointer-events-none">
        {/* Colonne gauche */}
        <div className="pointer-events-auto flex flex-col gap-5 md:h-full md:gap-8 md:py-24">
          <p className="font-mono text-[0.7rem] tracking-[0.35em] text-white/60">LE SON. LA PUISSANCE.</p>
          <h1 className="font-display text-[clamp(4.2rem,10vw,12rem)] uppercase leading-[0.8] tracking-tight">
            <span className="text-transparent [-webkit-text-stroke:2px_white]">Son</span>
            <br />
            Brut
          </h1>
          <p className="hidden max-w-[400px] text-[1.05rem] leading-relaxed text-white/70 md:block">
            Titane grade 2, embouts carbone, soudures main. <br />
            Un échappement qui se sent avant de s&apos;entendre — <br />
            homologué route ou taillé pour la piste.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <PillLink href={`/boutique?usage=${mode}`}>Voir la gamme</PillLink>
            <SoundButton usage={mode} />
          </div>
          <div className="mt-auto hidden items-center gap-4 md:flex">
            <div className="glass grid h-12 w-12 place-items-center rounded-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
                <text x="12" y="15.5" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">Ti</text>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.7rem] tracking-[0.1em] text-white/60">TITANE GRADE 2</span>
              <span className="text-[0.85rem] font-semibold">FABRIQUÉ EN FRANCE</span>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col items-center gap-6 md:h-full md:w-[450px] md:items-end md:justify-between md:py-24 md:text-right">
          <div className="pointer-events-auto flex flex-col items-center gap-5 md:items-end">
            <div className="flex gap-4 pt-16 md:pt-20">
              {cards.map((c) => (
                <button
                  key={c.f}
                  type="button"
                  onClick={() => choose(c.f)}
                  aria-pressed={mode === c.f}
                  className={`glass group relative flex w-[150px] flex-col items-center gap-5 rounded-[28px] p-4 pt-14 text-center transition-all duration-400 ease-pop hover:border-white/40 hover:bg-white/[0.12] md:w-[160px] ${
                    mode === c.f ? "!border-bronze" : ""
                  }`}
                >
                  <Image
                    src={c.img}
                    alt=""
                    width={200}
                    height={150}
                    className="-mt-28 w-[170px] -rotate-12 drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-7 group-hover:rotate-[-24deg] group-hover:scale-110"
                  />
                  <span className="flex flex-col text-[0.72rem]">
                    <span className="font-semibold">{c.title}</span>
                    <span className="text-white/60">à partir de {formatPrice(c.from)}</span>
                  </span>
                  {c.f === "circuit" && <span className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-alert" />}
                </button>
              ))}
            </div>
            <div className="hidden gap-4 md:flex">
              {(["route", "circuit"] as Finish[]).map((f, i) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => choose(mode === "route" ? "circuit" : "route")}
                  aria-label={i ? "Gamme suivante" : "Gamme précédente"}
                  className="glass grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10"
                >
                  {i ? "→" : "←"}
                </button>
              ))}
            </div>
          </div>
          <h2 className="hidden font-display text-[clamp(5rem,10vw,12rem)] uppercase leading-[0.8] tracking-tight md:block">
            <span className="text-transparent [-webkit-text-stroke:2px_white]">Pure</span>
            <br />
            Perf
          </h2>
        </div>
      </div>

      <canvas ref={frontRef} className="pointer-events-none absolute inset-0 z-[110] h-full w-full" aria-hidden />

      {/* Indicateur de scroll */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-[120] hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="font-mono text-[0.6rem] tracking-[0.3em] text-white/50">DÉFILER</span>
        <span className="h-8 w-px bg-gradient-to-b from-white/60 to-transparent" />
      </div>
    </section>
  );
}
