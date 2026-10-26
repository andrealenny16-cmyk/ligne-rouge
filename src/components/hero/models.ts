import * as THREE from "three";
import type { materials } from "./scene";

/* Les 4 pots 3D du hero, d'après la planche produit LIGNE ROUGE :
   moto ville = silencieux carbone à sortie hexagonale, moto circuit = silencieux titane conique à embout bleui,
   voiture ville = silencieux inox poli double sortie, voiture circuit = silencieux titane transversal quadruple sortie bleuie.
   Tous portent la plaque ovale « LIGNE ROUGE · Fabriqué en France ».
   Axe d'écoulement = +X. Chaque modèle est recentré et normalisé à la même taille. */

export type Vehicle = "moto" | "voiture";
export type Finish = "route" | "circuit";
type Mats = ReturnType<typeof materials>;
export type ExhaustModel = { root: THREE.Group; outlets: THREE.Object3D[] };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const along = (g: THREE.BufferGeometry) => g.rotateZ(-Math.PI / 2);

function gradientTexture(stops: [number, string][], horizontal = true) {
  const c = document.createElement("canvas");
  c.width = horizontal ? 512 : 8;
  c.height = horizontal ? 8 : 512;
  const g = c.getContext("2d")!;
  const grad = horizontal ? g.createLinearGradient(0, 0, 512, 0) : g.createLinearGradient(0, 0, 0, 512);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Plaque ovale émaillée « LIGNE ROUGE · FABRIQUÉ EN FRANCE ». `curved` : dessinée pivotée pour les UV d'un cylindre couché. */
function badgeTexture(curved: boolean) {
  const W = 1024;
  const H = 480;
  const c = document.createElement("canvas");
  c.width = curved ? H : W;
  c.height = curved ? W : H;
  const g = c.getContext("2d")!;
  if (curved) g.setTransform(0, -1, 1, 0, 0, W); // u autour du tube, v le long du tube
  const ellipse = (inset: number) => {
    g.beginPath();
    g.ellipse(W / 2, H / 2, W / 2 - inset, H / 2 - inset, 0, 0, Math.PI * 2);
  };
  ellipse(4);
  g.fillStyle = "#1c1c20";
  g.fill();
  ellipse(20);
  const face = g.createLinearGradient(0, 0, 0, H);
  face.addColorStop(0, "#f6f3ec");
  face.addColorStop(1, "#d9d4c8");
  g.fillStyle = face;
  g.fill();
  ellipse(34);
  g.strokeStyle = "#3a3a40";
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = "#1d1d22";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.save();
  g.translate(W / 2, H * 0.43);
  g.scale(0.78, 1);
  g.font = "800 150px 'Helvetica Neue', Arial, sans-serif";
  g.fillText("LIGNE ROUGE", 0, 0);
  g.restore();
  g.fillStyle = "#c8102e";
  g.fillRect(W / 2 - 230, H * 0.6, 460, 12);
  g.fillStyle = "#2a2a30";
  g.font = "600 40px 'Helvetica Neue', Arial, sans-serif";
  g.fillText("•  FABRIQUÉ EN FRANCE  •", W / 2, H * 0.74);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Matériaux propres aux pots du hero. */
function extraMaterials(m: Mats) {
  const rainbowStops: [number, string][] = [
    [0, "#e3c27a"], [0.15, "#c47a4a"], [0.3, "#9a5bc8"], [0.45, "#3f62d6"], [0.6, "#4fa0d8"], [0.75, "#d9b45f"], [0.9, "#9a5bc8"], [1, "#3f62d6"],
  ];
  const badge = (curved: boolean) =>
    new THREE.MeshPhysicalMaterial({ map: badgeTexture(curved), transparent: true, alphaTest: 0.5, metalness: 0.2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  return {
    rainbowTube: new THREE.MeshPhysicalMaterial({
      metalness: 1,
      roughness: 0.26,
      iridescence: 0.9,
      iridescenceIOR: 1.8,
      iridescenceThicknessRange: [250, 800],
      map: gradientTexture(rainbowStops),
    }),
    titaneSmooth: Object.assign(m.titane.clone(), { flatShading: false }),
    // titane brossé mat, assez rugueux pour ne pas refléter les zones noires du studio
    brushed: Object.assign(m.titane.clone(), { flatShading: false, roughness: 0.4, metalness: 1, color: new THREE.Color("#9c968c") }),
    inox: new THREE.MeshPhysicalMaterial({ color: "#e9e9ec", metalness: 1, roughness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.05 }),
    burntTip: new THREE.MeshPhysicalMaterial({
      map: gradientTexture([[0, "#c9a35a"], [0.35, "#8a5bc0"], [0.7, "#3f5fd0"], [1, "#2b3d9a"]], false),
      metalness: 1,
      roughness: 0.22,
      iridescence: 1,
      iridescenceThicknessRange: [300, 900],
    }),
    badgeFlat: badge(false),
    badgeCurved: badge(true),
  };
}

type Kit = ReturnType<typeof extraMaterials> & Mats;

/* ---------- Briques ---------- */

function tube(points: THREE.Vector3[], r: number, mat: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 96, r, 32, false), mat);
}

/** Cylindre ou tronc de cône couché selon X : rayon r0 côté −X, r1 côté +X. */
function shellX(r0: number, r1: number, len: number, x: number, mat: THREE.Material, sides = 96, open = false, theta = 0) {
  const m = new THREE.Mesh(along(new THREE.CylinderGeometry(r1, r0, len, sides, 1, open, theta)), mat);
  m.position.x = x;
  return m;
}

function weldX(k: Kit, root: THREE.Object3D, x: number, r: number, y = 0, z = 0) {
  const bead = new THREE.Mesh(new THREE.TorusGeometry(r, Math.max(0.016, r * 0.06), 10, 64).rotateY(Math.PI / 2), k.weld);
  bead.position.set(x, y, z);
  root.add(bead);
}

function rivetsX(k: Kit, root: THREE.Object3D, x: number, r: number, n: number, offset = 0) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + offset;
    const rv = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), k.titaneSmooth);
    rv.position.set(x, Math.sin(a) * r, Math.cos(a) * r);
    root.add(rv);
  }
}

/** Patte de fixation percée, soudée sur le dessus du corps. */
function bracket(k: Kit, root: THREE.Object3D, x: number, y: number, mat: THREE.Material = k.satin) {
  const s = new THREE.Shape();
  s.moveTo(-0.32, 0);
  s.lineTo(0.18, 0);
  s.quadraticCurveTo(0.28, 0.28, 0.08, 0.42);
  s.quadraticCurveTo(-0.08, 0.5, -0.14, 0.36);
  s.lineTo(-0.32, 0);
  const hole = new THREE.Path();
  hole.absarc(0.02, 0.3, 0.07, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
  geo.translate(0, 0, -0.025);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y - 0.02, 0);
  root.add(m);
}

/** Plaque ovale à plat (corps à pans) : normale +Z. */
function badgeFlat(k: Kit, root: THREE.Object3D, w: number, pos: THREE.Vector3, slope = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.47), k.badgeFlat);
  p.position.copy(pos);
  p.rotation.y = -slope; // suit la conicité du corps
  root.add(p);
}

/** Plaque ovale épousant un corps cylindrique ou conique (rayon r0 côté −X, r1 côté +X), centrée sur +Z à l'abscisse x. */
function badgeCurved(k: Kit, root: THREE.Object3D, w: number, x: number, r0: number, r1 = r0) {
  const span = (w * 0.47) / ((r0 + r1) / 2);
  const geo = along(new THREE.CylinderGeometry(r1 + 0.008, r0 + 0.008, w, 48, 1, true, -span / 2, span));
  const p = new THREE.Mesh(geo, k.badgeCurved);
  p.position.x = x;
  root.add(p);
}

/** Embout le long de X : manchon, âme sombre, lèvre roulée, soudure. Renvoie le point d'éjection. */
function tipX(k: Kit, root: THREE.Object3D, x0: number, len: number, r: number, y: number, z: number, sleeve: THREE.Material, lip: THREE.Material) {
  const x = x0 + len / 2;
  const s = new THREE.Mesh(along(new THREE.CylinderGeometry(r, r * 0.96, len, 64, 1, true)), sleeve);
  s.position.set(x, y, z);
  const bore = new THREE.Mesh(along(new THREE.CylinderGeometry(r * 0.86, r * 0.86, len * 0.98, 48, 1, true)), k.bore);
  bore.position.set(x, y, z);
  const l = new THREE.Mesh(new THREE.TorusGeometry(r * 0.93, r * 0.08, 20, 64).rotateY(Math.PI / 2), lip);
  l.position.set(x0 + len, y, z);
  const core = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 48).rotateY(Math.PI / 2), k.bore);
  core.position.set(x0 + 0.04, y, z);
  root.add(s, bore, l, core);
  weldX(k, root, x0 + 0.02, r * 0.98, y, z);
  const out = new THREE.Object3D();
  out.position.set(x0 + len + 0.05, y, z);
  root.add(out);
  return out;
}

/** Recentre et met à l'échelle pour que la plus grande dimension vaille `size`. */
function normalize(root: THREE.Group, size: number) {
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  const inner = new THREE.Group();
  while (root.children.length) inner.add(root.children[0]);
  inner.position.sub(c);
  root.add(inner);
  root.scale.setScalar(size / Math.max(s.x, s.y, s.z));
  return root;
}

/* ---------- Moto ville : silencieux carbone hexagonal, embout titane à bouche hexagonale ---------- */

function motoVille(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  const HEX = Math.PI / 6; // un pan à plat face à la caméra (+Z)
  const L = 2.8;
  const R0 = 0.5; // côté raccord
  const R1 = 0.64; // côté sortie
  g.add(shellX(R0, R1, L, 0, k.carbon, 6, false, HEX));
  // bagues titane rivetées aux deux bouts
  for (const [x, r] of [[-L / 2, R0], [L / 2 - 0.05, R1]] as const) {
    g.add(shellX(r + 0.03, r + 0.03, 0.09, x, k.titaneSmooth, 6, false, HEX));
    rivetsX(k, g, x, (r + 0.03) * Math.cos(Math.PI / 6), 6);
  }
  // embout de sortie titane à bouche hexagonale
  g.add(shellX(R1 + 0.03, R1 * 0.9, 0.42, L / 2 + 0.2, k.titaneSmooth, 6, false, HEX));
  g.add(shellX(R1 * 0.62, R1 * 0.62, 0.44, L / 2 + 0.2, k.bore, 6, true, HEX));
  const core = new THREE.Mesh(new THREE.CircleGeometry(R1 * 0.4, 48).rotateY(Math.PI / 2), k.satin);
  core.position.x = L / 2;
  g.add(core);
  // côté raccord : cône titane + manchon de liaison
  g.add(shellX(0.2, R0, 0.42, -L / 2 - 0.21, k.titaneSmooth, 64));
  g.add(shellX(0.19, 0.19, 0.7, -L / 2 - 0.77, k.titaneSmooth, 48));
  weldX(k, g, -L / 2 - 0.42, 0.2);
  bracket(k, g, -0.35, R0 + 0.07);
  const flat = Math.cos(Math.PI / 6); // distance axe → pan
  badgeFlat(k, g, 1.15, V(0.05, 0, (R0 + ((R1 - R0) * (0.05 + L / 2)) / L) * flat + 0.008), Math.atan(((R1 - R0) * flat) / L));
  const out = new THREE.Object3D();
  out.position.x = L / 2 + 0.5;
  g.add(out);
  return { root: normalize(g, 5.2), outlets: [out] };
}

/* ---------- Moto circuit : silencieux titane conique, embout bleui, raccord étagé chauffé ---------- */

function motoCircuit(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  const L = 3.2;
  g.add(shellX(0.3, 0.62, L, 0, k.brushed));
  // embout de sortie bleui, légèrement évasé
  g.add(shellX(0.63, 0.66, 0.42, L / 2 + 0.21, k.burntTip, 96, true));
  g.add(shellX(0.6, 0.6, 0.42, L / 2 + 0.21, k.bore, 64, true));
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.03, 12, 96).rotateY(Math.PI / 2), k.burntTip);
  lip.position.x = L / 2 + 0.42;
  g.add(lip);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.6, 64).rotateY(Math.PI / 2), k.bore);
  core.position.x = L / 2 + 0.05;
  g.add(core);
  weldX(k, g, L / 2, 0.625);
  rivetsX(k, g, L / 2 - 0.08, 0.62, 10);
  // raccord étagé, cordons chauffés (or → bleu)
  const steps: [number, number, number][] = [[0.3, 0.26, 0.28], [0.26, 0.24, 0.3], [0.24, 0.22, 0.42]];
  let x = -L / 2;
  for (const [ra, rb, len] of steps) {
    g.add(shellX(rb, ra, len, x - len / 2, k.titaneSmooth, 64));
    g.add(shellX(ra + 0.012, ra + 0.012, 0.06, x - 0.03, k.pipe, 64));
    x -= len;
  }
  bracket(k, g, 0.65, 0.56, k.titaneSmooth);
  const rAt = (x: number) => 0.3 + (0.32 * (x + L / 2)) / L;
  badgeCurved(k, g, 1.15, 0.35, rAt(0.35 - 0.575), rAt(0.35 + 0.575));
  const out = new THREE.Object3D();
  out.position.x = L / 2 + 0.5;
  g.add(out);
  return { root: normalize(g, 5.2), outlets: [out] };
}

/* ---------- Voiture ville : silencieux inox poli, double sortie, crochets de suspension ---------- */

function voitureVille(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  const L = 2.9;
  const R = 0.62;
  g.add(shellX(R, R, L, 0, k.inox));
  for (const sgn of [-1, 1]) {
    const roll = new THREE.Mesh(new THREE.TorusGeometry(R, 0.04, 14, 96).rotateY(Math.PI / 2), k.inox);
    roll.position.x = (sgn * L) / 2;
    // fond bombé
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2), k.inox);
    cap.rotation.z = (-sgn * Math.PI) / 2;
    cap.scale.y = 0.22;
    cap.position.x = (sgn * L) / 2;
    g.add(roll, cap);
  }
  // entrée : tube coudé + bride
  g.add(tube([V(-L / 2 - 0.05, 0, 0), V(-L / 2 - 0.7, 0, 0), V(-L / 2 - 1.05, 0.1, -0.2), V(-L / 2 - 1.2, 0.2, -0.55)], 0.19, k.inox));
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 48), k.satin);
  flange.position.set(-L / 2 - 1.2, 0.2, -0.57);
  flange.rotation.x = Math.PI / 2;
  g.add(flange);
  // crochets de suspension en fil plein
  for (const x of [-0.75, 0.85]) {
    g.add(tube([V(x, R - 0.02, 0), V(x, R + 0.28, 0), V(x + 0.22, R + 0.38, 0), V(x + 0.55, R + 0.38, 0)], 0.035, k.inox));
  }
  badgeCurved(k, g, 1.15, 0.05, R);
  // double sortie Ø 100 à lèvre roulée
  const outs = [-0.29, 0.29].map((z) => tipX(k, g, L / 2 - 0.25, 0.85, 0.27, -0.06, z, k.inox, k.inox));
  return { root: normalize(g, 5.4), outlets: outs };
}

/* ---------- Voiture circuit : silencieux titane transversal, 2 × 2 sorties bleuies, tubulure arc-en-ciel ---------- */

/** Pose une sortie orientée vers +Z (arrière de la voiture) en réutilisant tipX dans un repère pivoté. */
function tipZ(k: Kit, root: THREE.Object3D, x: number, z0: number, len: number, r: number, sleeve: THREE.Material, lip: THREE.Material) {
  const holder = new THREE.Group();
  holder.position.set(x, 0, z0);
  holder.rotation.y = -Math.PI / 2; // X local → +Z
  root.add(holder);
  return tipX(k, holder, 0, len, r, 0, 0, sleeve, lip);
}

function voitureCircuit(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  const L = 3.0;
  const R = 0.56;
  g.add(shellX(R, R, L, 0, k.brushed));
  // bagues chauffées arc-en-ciel, flasques coniques rivetées
  for (const sgn of [-1, 1]) {
    g.add(shellX(R + 0.025, R + 0.025, 0.16, sgn * (L / 2 - 0.25), k.rainbowTube));
    g.add(shellX(sgn < 0 ? R * 0.55 : R, sgn < 0 ? R : R * 0.55, 0.3, sgn * (L / 2 + 0.15), k.brushed));
    rivetsX(k, g, sgn * (L / 2 - 0.05), R + 0.01, 12);
    weldX(k, g, (sgn * L) / 2, R);
  }
  // à chaque bout : coude qui se divise vers deux sorties bleuies tournées vers l'arrière (+Z)
  const outs: THREE.Object3D[] = [];
  for (const sgn of [-1, 1]) {
    const x0 = sgn * (L / 2 + 0.3);
    for (const dx of [0.1, 0.72]) {
      const xt = sgn * (L / 2 + 0.3 + dx);
      g.add(tube([V(x0, 0, 0), V(x0 + sgn * 0.25, 0, 0.05), V(xt, 0, 0.35), V(xt, 0, 0.62)], 0.19, k.rainbowTube));
      outs.push(tipZ(k, g, xt, 0.6, 0.7, 0.27, k.burntTip, k.titaneSmooth));
    }
  }
  // entrées : deux tubes arc-en-ciel qui arrivent de l'avant de la voiture (−Z)
  for (const x of [-0.55, 0.55]) {
    g.add(tube([V(x, 0, -R + 0.05), V(x, 0.05, -1.2), V(x * 0.7, 0.15, -2.1)], 0.17, k.rainbowTube));
    const vb = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 12, 40), k.satin);
    vb.position.set(x * 0.85, 0.08, -1.55);
    g.add(vb);
  }
  bracket(k, g, -0.9, R + 0.03, k.titaneSmooth);
  bracket(k, g, 0.9, R + 0.03, k.titaneSmooth);
  badgeCurved(k, g, 1.15, 0, R);
  return { root: normalize(g, 5.6), outlets: outs };
}

/** Construit les 4 modèles. Les pots voiture sont présentés de 3/4 pour montrer leurs sorties. */
export function buildModels(m: Mats): Record<Vehicle, Record<Finish, ExhaustModel>> {
  const k: Kit = { ...m, ...extraMaterials(m) };
  const turn = (model: ExhaustModel, x: number, y: number): ExhaustModel => {
    const holder = new THREE.Group();
    model.root.rotation.set(x, y, 0);
    holder.add(model.root);
    return { root: holder, outlets: model.outlets };
  };
  return {
    moto: { route: motoVille(k), circuit: motoCircuit(k) },
    voiture: { route: turn(voitureVille(k), 0.15, -0.6), circuit: turn(voitureCircuit(k), 0.28, -0.42) },
  };
}
