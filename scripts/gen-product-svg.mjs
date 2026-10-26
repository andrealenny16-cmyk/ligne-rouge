// Génère les illustrations produit LIGNE ROUGE (vue 3/4 et profil) dans public/products/.
// Usage : node scripts/gen-product-svg.mjs — voir .claude/skills/add-product/SKILL.md
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PRODUCTS = [
  { slug: "titan-gt", light: "#E8DCC8", body: "oval", tips: 4, finish: "titane", tipD: 44 },
  { slug: "carbon-fury", light: "#4A7BFF", body: "oval", tips: 2, finish: "noir", tipD: 46 },
  { slug: "inferno-r", light: "#3B6BFF", body: "hex", tips: 4, finish: "bleu", tipD: 50 },
  { slug: "spectre-s", light: "#3B82F6", body: "hex", tips: 2, finish: "noir", tipD: 40, moto: true },
  { slug: "viper-twin", light: "#22C55E", body: "oval", tips: 2, finish: "inox", tipD: 38, twin: true, moto: true },
  { slug: "hellcat-racing", light: "#E11D2E", body: "hex", tips: 1, finish: "titane", tipD: 62, collector: true, moto: true },
];

const FINISH = {
  titane: { a: "#ECEAE4", b: "#B9B5AC", c: "#7E7A72", heat: true },
  noir: { a: "#55555B", b: "#26262A", c: "#0E0E10", heat: false },
  bleu: { a: "#A9B6FF", b: "#4F6BD8", c: "#1D2470", heat: true },
  inox: { a: "#F6F6F7", b: "#C7C9CE", c: "#8A8D94", heat: false },
};

function defs(f, light = "#E8DCC8") {
  return `
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0" stop-color="#1E1E22"/><stop offset="1" stop-color="#070708"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${light}" stop-opacity="0.38"/><stop offset="1" stop-color="${light}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${f.c}"/><stop offset="0.18" stop-color="${f.a}"/>
      <stop offset="0.45" stop-color="${f.b}"/><stop offset="0.8" stop-color="${f.c}"/>
      <stop offset="1" stop-color="${f.b}"/>
    </linearGradient>
    <linearGradient id="ti" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8C887F"/><stop offset="0.3" stop-color="#F2F0EA"/>
      <stop offset="0.6" stop-color="#ABA79E"/><stop offset="1" stop-color="#6E6A62"/>
    </linearGradient>
    <linearGradient id="heat" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#C08457" stop-opacity="0"/><stop offset="0.3" stop-color="#C08457" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="#8B5CF6" stop-opacity="0.55"/><stop offset="1" stop-color="#3B82F6" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.25"/>
    </linearGradient>
    <pattern id="carbon" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#161618"/>
      <rect width="4" height="4" fill="#2E2E33"/><rect x="4" y="4" width="4" height="4" fill="#2E2E33"/>
    </pattern>
    <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bore" cx="45%" cy="45%" r="60%">
      <stop offset="0" stop-color="#000"/><stop offset="0.8" stop-color="#1a1a1a"/><stop offset="1" stop-color="#444"/>
    </radialGradient>
  </defs>`;
}

function engraving(x, y, size, rotate = 0) {
  return `
  <g transform="translate(${x} ${y}) rotate(${rotate})" font-family="Arial Black, Arial, sans-serif" font-weight="900"
     font-size="${size}" letter-spacing="${size * 0.18}" text-anchor="middle">
    <text y="1.5" fill="#fff" fill-opacity="0.35">LIGNE ROUGE</text>
    <text fill="#000" fill-opacity="0.38">LIGNE ROUGE</text>
  </g>`;
}

// Silencieux de profil, centré verticalement sur cy
function bodyProfile(p, f, x, cy, w, h) {
  const top = cy - h / 2;
  const r = p.body === "oval" ? h * 0.32 : 10;
  let s = `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#metal)"/>`;
  if (p.body === "hex") {
    s += `<rect x="${x + 4}" y="${top + h * 0.2}" width="${w - 8}" height="1.6" fill="#fff" fill-opacity="0.45"/>`;
    s += `<rect x="${x + 4}" y="${top + h * 0.78}" width="${w - 8}" height="1.6" fill="#000" fill-opacity="0.35"/>`;
  }
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#gloss)"/>`;
  // Collier de fixation + bride arrière
  s += `<rect x="${x + w * 0.16}" y="${top - 6}" width="20" height="${h + 12}" rx="5" fill="url(#ti)"/>`;
  s += `<circle cx="${x + w * 0.16 + 10}" cy="${top - 10}" r="7" fill="url(#ti)" stroke="#6e6a62"/>`;
  s += `<rect x="${x + w - 8}" y="${top + 4}" width="26" height="${h - 8}" rx="6" fill="url(#carbon)"/>`;
  s += `<rect x="${x + w - 8}" y="${top + 4}" width="26" height="${h - 8}" rx="6" fill="url(#gloss)"/>`;
  s += engraving(x + w * 0.56, cy + h * 0.1, Math.min(24, h * 0.16, w / 17));
  return s;
}

function tipProfile(x, cy, d, len) {
  return `
  <rect x="${x}" y="${cy - d / 2}" width="${len}" height="${d}" rx="4" fill="url(#carbon)"/>
  <rect x="${x}" y="${cy - d / 2}" width="${len}" height="${d}" rx="4" fill="url(#gloss)"/>
  <rect x="${x + len - 10}" y="${cy - d / 2 - 3}" width="12" height="${d + 6}" rx="3" fill="url(#ti)"/>`;
}

function profile(p) {
  const f = FINISH[p.finish];
  let s = "";
  const cy = 300;
  const twinOffsets = p.twin ? [-70, 70] : [0];
  const h = p.twin ? 110 : p.collector ? 150 : 160;
  const bx = p.collector ? 370 : 250;
  const bw = p.collector ? 220 : 340;

  // Tube d'entrée ou collecteur 4-en-1
  if (p.collector) {
    [-60, -20, 20, 60].forEach((o, i) => {
      s += `<path d="M ${70 + i * 8} ${cy + o * 2.2} C 200 ${cy + o * 2.2}, 250 ${cy + o * 0.4}, 330 ${cy}"
        stroke="url(#ti)" stroke-width="26" fill="none" stroke-linecap="round"/>`;
    });
    s += `<path d="M 70 ${cy - 140} L 330 ${cy}" stroke="url(#heat)" stroke-width="0"/>`;
    s += `<rect x="300" y="${cy - 26}" width="80" height="52" rx="10" fill="url(#ti)"/>`;
    s += `<rect x="300" y="${cy - 26}" width="80" height="52" rx="10" fill="url(#heat)"/>`;
  } else {
    twinOffsets.forEach((o) => {
      s += `<rect x="60" y="${cy + o - 22}" width="${bx - 50}" height="44" rx="8" fill="url(#ti)"/>`;
      if (f.heat) s += `<rect x="60" y="${cy + o - 22}" width="${bx - 50}" height="44" rx="8" fill="url(#heat)"/>`;
      s += `<rect x="${bx - 30}" y="${cy + o - 36}" width="16" height="72" rx="4" fill="url(#ti)" stroke="#7e7a72" stroke-width="1"/>`;
    });
  }

  twinOffsets.forEach((o) => {
    s += bodyProfile(p, f, bx, cy + o, bw, h);
  });

  // Embouts
  const tx = bx + bw + 16;
  const len = p.collector ? 70 : 90;
  if (p.tips === 1) s += tipProfile(tx, cy, p.tipD, len);
  else if (p.twin) twinOffsets.forEach((o) => (s += tipProfile(tx, cy + o, p.tipD, len)));
  else if (p.tips === 2) [-34, 34].forEach((o) => (s += tipProfile(tx, cy + o, p.tipD, len)));
  else
    [-40, 40].forEach((o) => {
      s += tipProfile(tx + 12, cy + o - 6, p.tipD * 0.95, len - 6);
      s += tipProfile(tx, cy + o, p.tipD, len);
    });

  return svg(f, `<ellipse cx="420" cy="470" rx="330" ry="26" fill="url(#shadow)"/>${s}`, p.light);
}

// Vue 3/4 avant : corps cylindrique en perspective, face arrière visible
function threeQuarter(p) {
  const f = FINISH[p.finish];
  const h = p.twin ? 120 : 170;
  const w = p.collector ? 300 : 380;
  const rx = 42;
  const bodies = p.twin ? [-78, 78] : [0];
  let s = "";

  bodies.forEach((o) => {
    const top = o - h / 2;
    s += `<g transform="translate(0 ${0})">`;
    // tube d'entrée
    s += `<rect x="${-w / 2 - 150}" y="${o - 20}" width="170" height="40" rx="8" fill="url(#ti)"/>`;
    if (f.heat) s += `<rect x="${-w / 2 - 150}" y="${o - 20}" width="170" height="40" rx="8" fill="url(#heat)"/>`;
    s += `<ellipse cx="${-w / 2 + 6}" cy="${o}" rx="10" ry="34" fill="url(#ti)" stroke="#7e7a72"/>`;
    // corps
    s += `<rect x="${-w / 2}" y="${top}" width="${w}" height="${h}" rx="${p.body === "oval" ? h * 0.3 : 12}" fill="url(#metal)"/>`;
    if (p.body === "hex") {
      s += `<rect x="${-w / 2 + 6}" y="${top + h * 0.22}" width="${w - 12}" height="1.6" fill="#fff" fill-opacity="0.5"/>`;
      s += `<rect x="${-w / 2 + 6}" y="${top + h * 0.78}" width="${w - 12}" height="1.6" fill="#000" fill-opacity="0.3"/>`;
    }
    s += `<rect x="${-w / 2}" y="${top}" width="${w}" height="${h}" rx="${p.body === "oval" ? h * 0.3 : 12}" fill="url(#gloss)"/>`;
    s += `<rect x="${-w / 2 + 50}" y="${top - 7}" width="22" height="${h + 14}" rx="5" fill="url(#ti)"/>`;
    s += engraving(-10, o + h * 0.1, Math.min(24, h * 0.15, w / 16));
    // face arrière (carbone)
    s += `<ellipse cx="${w / 2}" cy="${o}" rx="${rx}" ry="${h / 2}" fill="url(#carbon)" stroke="url(#ti)" stroke-width="7"/>`;
    s += `<ellipse cx="${w / 2}" cy="${o}" rx="${rx}" ry="${h / 2}" fill="url(#gloss)"/>`;
    s += `</g>`;
  });

  // Embouts qui sortent de la face arrière
  const tips = [];
  if (p.tips === 1) tips.push([0, p.tipD]);
  else if (p.twin) bodies.forEach((o) => tips.push([o, p.tipD]));
  else if (p.tips === 2) tips.push([-38, p.tipD], [38, p.tipD]);
  else tips.push([-58, p.tipD * 0.72, -18], [-20, p.tipD * 0.72, 22], [20, p.tipD * 0.72, -18], [58, p.tipD * 0.72, 22]);

  tips
    .sort((a, b) => (a[2] ?? 0) - (b[2] ?? 0))
    .forEach(([y, d, dx = 0]) => {
      const x0 = w / 2 + dx * 0.4;
      const len = 80;
      const r = d / 2;
      s += `<rect x="${x0}" y="${y - r}" width="${len}" height="${d}" fill="url(#carbon)"/>`;
      s += `<rect x="${x0}" y="${y - r}" width="${len}" height="${d}" fill="url(#gloss)"/>`;
      s += `<ellipse cx="${x0 + len}" cy="${y}" rx="${r * 0.42}" ry="${r + 3}" fill="url(#ti)"/>`;
      s += `<ellipse cx="${x0 + len + 1}" cy="${y}" rx="${r * 0.3}" ry="${r - 3}" fill="url(#bore)"/>`;
      if (p.finish === "bleu" || p.finish === "titane")
        s += `<ellipse cx="${x0 + len}" cy="${y}" rx="${r * 0.42}" ry="${r + 3}" fill="url(#heat)" opacity="0.7"/>`;
    });

  return svg(
    f,
    `<ellipse cx="400" cy="485" rx="320" ry="30" fill="url(#shadow)"/>
     <g transform="translate(390 300) rotate(-14) skewX(-6)">${s}</g>`,
    p.light,
  );
}

function svg(f, inner, light) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">${defs(f, light)}
  <rect width="800" height="600" fill="url(#bg)"/>
  <ellipse cx="420" cy="290" rx="380" ry="230" fill="url(#glow)"/>
  <rect y="430" width="800" height="170" fill="url(#floor)"/>
  <line x1="0" y1="470" x2="800" y2="470" stroke="${light}" stroke-opacity="0.18"/>
  ${inner}
</svg>
`;
}

const out = join(process.cwd(), "public", "products");
mkdirSync(out, { recursive: true });
for (const p of PRODUCTS) {
  writeFileSync(join(out, `${p.slug}-profil.svg`), profile(p));
  const tq = threeQuarter(p);
  writeFileSync(join(out, `${p.slug}-34.svg`), tq);
  // Version détourée (sans fond ni ombre) pour les cartes du hero
  writeFileSync(
    join(out, `${p.slug}-cut.svg`),
    tq.replace(/<rect width="800" height="600" fill="url\(#bg\)"\/>/, "").replace(/<ellipse[^>]*url\(#shadow\)[^>]*\/>/, ""),
  );
}
console.log(`${PRODUCTS.length * 2} illustrations générées dans public/products/`);
