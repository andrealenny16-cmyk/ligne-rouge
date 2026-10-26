// Génère l'identité LIGNE ROUGE (plaque rivetée) dans public/brand/ et src/app/icon.svg.
// Les textes sont vectorisés (Anton + Inter) : les fichiers s'affichent partout sans police installée.
// Usage : node scripts/gen-brand.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import opentype from "opentype.js";

const font = (p) => {
  const b = readFileSync(join("node_modules/@fontsource", p));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const anton = font("anton/files/anton-latin-400-normal.woff");
const inter = font("inter/files/inter-latin-600-normal.woff");

/** Texte -> chemin SVG centré sur cx, avec interlettrage en px. */
function text(f, str, size, cx, baseline, tracking = 0, maxWidth = Infinity) {
  const scale = size / f.unitsPerEm;
  // Glyphe par caractère : évite le moteur de ligatures (non supporté pour Inter)
  const glyphs = [...str].map((ch) => f.charToGlyph(ch));
  let width = glyphs.reduce((w, g) => w + g.advanceWidth * scale + tracking, -tracking);
  if (width > maxWidth) return text(f, str, size * (maxWidth / width), cx, baseline, tracking * (maxWidth / width));
  let x = cx - width / 2;
  let d = "";
  for (const g of glyphs) {
    d += g.getPath(x, baseline, size).toPathData(2);
    x += g.advanceWidth * scale + tracking;
  }
  return d;
}

const W = 640;
const H = 280;
const CX = 320;
const CY = 140;
const NAME = text(anton, "LIGNE ROUGE", 86, CX, 148, 4.5, 410);
const SUB = text(inter, "Ti · GRADE 2 · FABRIQUÉ EN FRANCE", 17, CX, 210, 3.2, 360);
const RED = "#C8102E";

function plateColor() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="LIGNE ROUGE">
  <defs>
    <linearGradient id="ti" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8D8981"/><stop offset="0.22" stop-color="#EFEEE9"/>
      <stop offset="0.55" stop-color="#B7B3AA"/><stop offset="0.82" stop-color="#E4E2DC"/>
      <stop offset="1" stop-color="#85817A"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7F6F2"/><stop offset="0.5" stop-color="#7A766F"/><stop offset="1" stop-color="#4E4B46"/>
    </linearGradient>
    <linearGradient id="rivet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAFAF7"/><stop offset="0.5" stop-color="#A9A59D"/><stop offset="1" stop-color="#5E5A54"/>
    </linearGradient>
    <pattern id="brush" width="${W}" height="3" patternUnits="userSpaceOnUse">
      <rect width="${W}" height="1" fill="#FFFFFF" fill-opacity="0.09"/>
      <rect y="2" width="${W}" height="1" fill="#000000" fill-opacity="0.05"/>
    </pattern>
    <clipPath id="plate"><ellipse cx="${CX}" cy="${CY}" rx="300" ry="125"/></clipPath>
  </defs>
  <ellipse cx="${CX}" cy="${CY + 3}" rx="304" ry="129" fill="#000" fill-opacity="0.35"/>
  <ellipse cx="${CX}" cy="${CY}" rx="304" ry="129" fill="url(#edge)"/>
  <ellipse cx="${CX}" cy="${CY}" rx="300" ry="125" fill="url(#ti)"/>
  <rect width="${W}" height="${H}" fill="url(#brush)" clip-path="url(#plate)"/>
  <ellipse cx="${CX}" cy="${CY}" rx="282" ry="108" fill="none" stroke="#3E3B37" stroke-opacity="0.35" stroke-width="1.6"/>
  <ellipse cx="${CX}" cy="${CY + 1.5}" rx="282" ry="108" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="1"/>
  ${[52, 588]
    .map(
      (x) => `<circle cx="${x}" cy="${CY + 1.5}" r="15" fill="#3A3733" fill-opacity="0.45"/>
  <circle cx="${x}" cy="${CY}" r="14" fill="url(#rivet)"/>
  <circle cx="${x}" cy="${CY}" r="5" fill="#6E6A63"/><circle cx="${x - 4}" cy="${CY - 5}" r="3" fill="#FFFFFF" fill-opacity="0.7"/>`,
    )
    .join("\n  ")}
  <path d="${NAME}" fill="#FFFFFF" fill-opacity="0.55" transform="translate(0 1.6)"/>
  <path d="${NAME}" fill="#2A2825"/>
  <rect x="${CX - 150}" y="168" width="300" height="7" rx="1" fill="${RED}"/>
  <rect x="${CX - 150}" y="168" width="300" height="2" fill="#FFFFFF" fill-opacity="0.25"/>
  <path d="${SUB}" fill="#FFFFFF" fill-opacity="0.5" transform="translate(0 1)"/>
  <path d="${SUB}" fill="#3B3834"/>
</svg>
`;
}

function plateMono(ink) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="LIGNE ROUGE">
  <ellipse cx="${CX}" cy="${CY}" rx="300" ry="125" fill="none" stroke="${ink}" stroke-width="5"/>
  <ellipse cx="${CX}" cy="${CY}" rx="282" ry="108" fill="none" stroke="${ink}" stroke-opacity="0.45" stroke-width="1.5"/>
  ${[52, 588].map((x) => `<circle cx="${x}" cy="${CY}" r="12" fill="none" stroke="${ink}" stroke-width="3"/><circle cx="${x}" cy="${CY}" r="4" fill="${ink}"/>`).join("\n  ")}
  <path d="${NAME}" fill="${ink}"/>
  <rect x="${CX - 150}" y="168" width="300" height="7" rx="1" fill="${RED}"/>
  <path d="${SUB}" fill="${ink}" fill-opacity="0.75"/>
</svg>
`;
}

function icon() {
  const lr = text(anton, "LR", 30, 32, 43, 0.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs><linearGradient id="ti" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8D8981"/><stop offset="0.25" stop-color="#EFEEE9"/><stop offset="0.6" stop-color="#B7B3AA"/><stop offset="1" stop-color="#85817A"/>
  </linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="#0D0D0F"/>
  <ellipse cx="32" cy="32" rx="29" ry="21" fill="url(#ti)" stroke="#4E4B46" stroke-width="1.5"/>
  <circle cx="8.5" cy="32" r="2.3" fill="#6E6A63"/><circle cx="55.5" cy="32" r="2.3" fill="#6E6A63"/>
  <path d="${lr}" fill="#2A2825"/>
  <rect x="21" y="45" width="22" height="2.6" fill="${RED}"/>
</svg>
`;
}

mkdirSync("public/brand", { recursive: true });
writeFileSync("public/brand/ligne-rouge-plaque.svg", plateColor());
writeFileSync("public/brand/ligne-rouge-plaque-blanc.svg", plateMono("#FFFFFF"));
writeFileSync("public/brand/ligne-rouge-plaque-noir.svg", plateMono("#111111"));
writeFileSync("public/brand/ligne-rouge-icone.svg", icon());
writeFileSync("src/app/icon.svg", icon());
console.log("Identité LIGNE ROUGE générée : public/brand/ + src/app/icon.svg");
