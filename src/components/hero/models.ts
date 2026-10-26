import * as THREE from "three";
import type { materials } from "./scene";

/* Les 4 pots 3D du hero, tous différents et marqués LIGNE ROUGE :
   moto ville (slip-on hexagonal), moto circuit (ligne 4-en-1 type MotoGP),
   voiture ville (cat-back titane à valve, silencieux transversal, 2 × 2 sorties carbone),
   voiture circuit (ligne décatalysée bleuie, X-pipe, 2 × 2 sorties titane brûlé).
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

/** Matériaux complémentaires (tubes chauffés le long de leur longueur, céramique noire, versions lisses). */
function extraMaterials(m: Mats) {
  const heatStops: [number, string][] = [
    [0, "#cfc9bf"], [0.18, "#d6b46a"], [0.3, "#a86fc4"], [0.42, "#5b6fd6"], [0.55, "#cfc9bf"], [0.75, "#cfc9bf"], [0.88, "#d6b46a"], [1, "#7a64c8"],
  ];
  const rainbowStops: [number, string][] = [
    [0, "#e3c27a"], [0.15, "#c47a4a"], [0.3, "#9a5bc8"], [0.45, "#3f62d6"], [0.6, "#4fa0d8"], [0.75, "#d9b45f"], [0.9, "#9a5bc8"], [1, "#3f62d6"],
  ];
  const base = { metalness: 1, roughness: 0.3, iridescence: 0.6, iridescenceIOR: 1.8, iridescenceThicknessRange: [250, 800] as [number, number] };
  return {
    heatTube: new THREE.MeshPhysicalMaterial({ ...base, map: gradientTexture(heatStops), roughnessMap: m.titane.roughnessMap }),
    rainbowTube: new THREE.MeshPhysicalMaterial({ ...base, roughness: 0.26, iridescence: 0.9, map: gradientTexture(rainbowStops) }),
    titaneSmooth: Object.assign(m.titane.clone(), { flatShading: false }),
    bleuSmooth: Object.assign(m.bleu.clone(), { flatShading: false }),
    // titane brossé (silencieux voiture) : assez rugueux pour ne pas refléter les zones noires du studio
    brushed: Object.assign(m.titane.clone(), { flatShading: false, roughness: 0.42, metalness: 0.95 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: "#141416", metalness: 0.4, roughness: 0.55, clearcoat: 0.4 }),
    burntBox: new THREE.MeshPhysicalMaterial({
      color: "#a7acc4",
      metalness: 1,
      roughness: 0.32,
      roughnessMap: m.titane.roughnessMap,
      iridescence: 0.55,
      iridescenceIOR: 1.7,
      iridescenceThicknessRange: [300, 750],
    }),
    burntTip: new THREE.MeshPhysicalMaterial({
      map: gradientTexture([[0, "#c9a35a"], [0.35, "#8a5bc0"], [0.7, "#3f5fd0"], [1, "#2b3d9a"]], false),
      metalness: 1,
      roughness: 0.22,
      iridescence: 1,
      iridescenceThicknessRange: [300, 900],
    }),
  };
}

type Kit = ReturnType<typeof extraMaterials> & Mats;

/* ---------- Briques ---------- */

function tube(points: THREE.Vector3[], r: number, mat: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 96, r, 32, false), mat);
}

function weldX(k: Kit, root: THREE.Object3D, x: number, r: number, y = 0, z = 0) {
  const bead = new THREE.Mesh(new THREE.TorusGeometry(r, Math.max(0.018, r * 0.08), 10, 64).rotateY(Math.PI / 2), k.weld);
  bead.position.set(x, y, z);
  root.add(bead);
}

function rivetsX(k: Kit, root: THREE.Object3D, x: number, r: number, n: number, scaleY = 1) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rv = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), k.titane);
    rv.position.set(x, Math.sin(a) * r * scaleY, Math.cos(a) * r);
    root.add(rv);
  }
}

/** Ressort de maintien (hélice) entre x0 et x1, décalé en y/z. */
function spring(k: Kit, root: THREE.Object3D, x0: number, x1: number, y: number, z: number) {
  const pts: THREE.Vector3[] = [];
  const turns = 9;
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const a = t * turns * Math.PI * 2;
    pts.push(V(x0 + (x1 - x0) * t, y + Math.sin(a) * 0.045, z + Math.cos(a) * 0.045));
  }
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.011, 6), k.titane));
}

/** Plaque de marque LIGNE ROUGE (logo vectoriel) posée sur une face. */
function plate(k: Kit, root: THREE.Object3D, w: number, pos: THREE.Vector3, rotY = 0, rotX = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.4375), k.plate);
  p.position.copy(pos);
  p.rotation.order = "YXZ"; // couchée d'abord (X), puis orientée (Y)
  p.rotation.set(rotX, rotY, 0);
  root.add(p);
}

/** Embout le long de X : manchon, âme sombre, lèvre, soudure. Renvoie le point d'éjection. */
function tipX(k: Kit, root: THREE.Object3D, x0: number, len: number, r: number, y: number, z: number, sleeve: THREE.Material, lip: THREE.Material) {
  const x = x0 + len / 2;
  const s = new THREE.Mesh(along(new THREE.CylinderGeometry(r, r * 0.97, len, 64, 1, true)), sleeve);
  s.position.set(x, y, z);
  const bore = new THREE.Mesh(along(new THREE.CylinderGeometry(r * 0.84, r * 0.84, len * 0.98, 48, 1, true)), k.bore);
  bore.position.set(x, y, z);
  const l = new THREE.Mesh(new THREE.TorusGeometry(r * 0.93, r * 0.12, 20, 64).rotateY(Math.PI / 2), lip);
  l.position.set(x0 + len, y, z);
  // âme perforée visible au fond de l'embout
  const core = new THREE.Mesh(new THREE.CircleGeometry(r * 0.82, 48).rotateY(Math.PI / 2), k.carbon);
  core.position.set(x0 + 0.05, y, z);
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

/* ---------- Moto ville : slip-on hexagonal ---------- */

function motoVille(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  const R = 0.62;
  const L = 2.5;
  const body = new THREE.Mesh(along(new THREE.CylinderGeometry(R, R, L, 6, 1, true, Math.PI / 6)), k.titane);
  g.add(body);
  for (const x of [-L / 2, L / 2]) {
    const band = new THREE.Mesh(along(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.1, 6, 1, false, Math.PI / 6)), k.satin);
    band.position.x = x;
    g.add(band);
    rivetsX(k, g, x, R * 0.93, 12);
  }
  const front = new THREE.Mesh(along(new THREE.CylinderGeometry(R, 0.24, 0.5, 6, 1, false, Math.PI / 6)), k.carbon);
  front.position.x = -L / 2 - 0.25;
  const rear = new THREE.Mesh(along(new THREE.CylinderGeometry(R * 0.82, R, 0.32, 6, 1, false, Math.PI / 6)), k.carbon);
  rear.position.x = L / 2 + 0.16;
  g.add(front, rear);
  // collier carbone + patte de fixation
  const strap = new THREE.Mesh(along(new THREE.CylinderGeometry(R + 0.05, R + 0.05, 0.22, 6, 1, false, Math.PI / 6)), k.carbon);
  strap.position.x = -0.45;
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.12), k.satin);
  tab.position.set(-0.45, R + 0.2, 0);
  g.add(strap, tab);
  // raccord bleui + ressorts
  g.add(tube([V(-L / 2 - 0.5, 0, 0), V(-2.3, -0.02, 0), V(-2.9, -0.18, 0), V(-3.4, -0.5, 0)], 0.2, k.heatTube));
  weldX(k, g, -L / 2 - 0.5, 0.205);
  const flange = new THREE.Mesh(along(new THREE.CylinderGeometry(0.27, 0.27, 0.08, 48)), k.satin);
  flange.position.x = -2.0;
  g.add(flange);
  spring(k, g, -2.15, -1.8, 0.26, 0);
  spring(k, g, -2.15, -1.8, -0.26, 0);
  plate(k, g, 1.05, V(0.1, 0, R * Math.cos(Math.PI / 6) + 0.004));
  const out = tipX(k, g, L / 2 + 0.3, 0.32, 0.22, 0, 0, k.carbon, k.heatTube);
  return { root: normalize(g, 5.2), outlets: [out] };
}

/* ---------- Moto circuit : ligne 4-en-1 type MotoGP ---------- */

function motoCircuit(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  // 4 collecteurs arc-en-ciel qui descendent des sorties culasse
  [-0.5, -0.17, 0.17, 0.5].forEach((z, i) => {
    const y0 = 1.25 - Math.abs(z) * 0.3;
    g.add(
      tube(
        [V(-3.55 + i * 0.06, y0, z), V(-3.45, 0.55, z * 1.05), V(-3.0, -0.15, z * 0.9), V(-2.35, -0.28, z * 0.5), V(-1.65, -0.08, z * 0.18), V(-1.5, 0, z * 0.12)],
        0.155,
        k.rainbowTube,
      ),
    );
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 32), k.satin);
    flange.position.set(-3.55 + i * 0.06, y0 + 0.02, z);
    g.add(flange);
  });
  // collecteur 4→1, tube intermédiaire, silencieux court conique bleui
  const merge = new THREE.Mesh(along(new THREE.CylinderGeometry(0.25, 0.44, 0.55, 64)), k.rainbowTube);
  merge.position.x = -1.25;
  const mid = new THREE.Mesh(along(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 64)), k.pipe);
  mid.position.x = -0.68;
  const body = new THREE.Mesh(along(new THREE.CylinderGeometry(0.58, 0.42, 1.7, 96)), k.pipe); // titane bleui aux extrémités
  body.position.x = 0.47;
  g.add(merge, mid, body);
  weldX(k, g, -0.97, 0.255);
  weldX(k, g, -0.38, 0.43);
  for (const x of [-0.38, 1.32]) {
    const band = new THREE.Mesh(along(new THREE.CylinderGeometry(x < 0 ? 0.45 : 0.6, x < 0 ? 0.45 : 0.6, 0.09, 96)), k.satin);
    band.position.x = x;
    g.add(band);
    rivetsX(k, g, x, x < 0 ? 0.44 : 0.59, 14);
  }
  // embout carbone coupé en biseau
  const cap = new THREE.Mesh(along(new THREE.CylinderGeometry(0.5, 0.58, 0.34, 96)), k.carbon);
  cap.position.x = 1.52;
  cap.rotation.y = 0.2;
  g.add(cap);
  spring(k, g, -1.55, -1.05, 0.34, 0.2);
  spring(k, g, -1.55, -1.05, -0.34, -0.2);
  spring(k, g, -0.5, -0.25, 0.4, 0);
  plate(k, g, 0.95, V(0.5, 0.02, 0.535), 0);
  const out = tipX(k, g, 1.66, 0.12, 0.3, 0, 0, k.carbon, k.titaneSmooth);
  return { root: normalize(g, 5.2), outlets: [out] };
}

/* ---------- Pièces de ligne voiture ---------- */

/** Silencieux arrière transversal : section ovale (vue de côté) extrudée sur la largeur de la voiture (Z). */
function ovalCan(depth: number, h: number, width: number, mat: THREE.Material) {
  const r = h / 2;
  const hl = depth / 2 - r;
  const s = new THREE.Shape();
  s.moveTo(-hl, -r);
  s.lineTo(hl, -r);
  s.absarc(hl, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-hl, r);
  s.absarc(-hl, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 6, curveSegments: 48 });
  geo.translate(0, 0, -width / 2);
  return new THREE.Mesh(geo, mat);
}

/** Résonateur cylindrique enfilé sur un tube, avec cônes soudés. */
function resonator(k: Kit, g: THREE.Group, x: number, z: number, len: number, r: number, pipeR: number, mat: THREE.Material) {
  const body = new THREE.Mesh(along(new THREE.CylinderGeometry(r, r, len, 64)), mat);
  body.position.set(x, 0, z);
  g.add(body);
  for (const sgn of [-1, 1]) {
    const cone = new THREE.Mesh(along(new THREE.CylinderGeometry(sgn < 0 ? r : pipeR, sgn < 0 ? pipeR : r, 0.22, 48)), mat);
    cone.rotation.z = sgn < 0 ? Math.PI : 0;
    cone.position.set(x + sgn * (len / 2 + 0.11), 0, z);
    g.add(cone);
    weldX(k, g, x + sgn * (len / 2), r, 0, z);
  }
}

/** Collier à bride entre deux tronçons. */
function clamp(k: Kit, g: THREE.Group, x: number, y: number, z: number, r: number) {
  const band = new THREE.Mesh(along(new THREE.CylinderGeometry(r * 1.25, r * 1.25, 0.09, 48)), k.satin);
  band.position.set(x, y, z);
  const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.06), k.satin);
  bolt.position.set(x, y + r * 1.3, z);
  g.add(band, bolt);
}

/** Patte de suspension : tige + silent-bloc caoutchouc. */
function hanger(k: Kit, g: THREE.Group, x: number, y: number, z: number) {
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 12), k.satin);
  rod.position.set(x, y + 0.14, z);
  const rubber = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.035, 12, 24), k.ceramic);
  rubber.position.set(x, y + 0.3, z);
  g.add(rod, rubber);
}

/** Tracé d'un tube principal : départ derrière les catas, passage au-dessus du pont, entrée dans le silencieux. */
function mainPath(s: number, xIn: number, cross = false) {
  const pts = [V(-7.4, 0, s * 0.3), V(-6.2, 0, s * 0.3)];
  if (cross) pts.push(V(-4.9, 0, s * 0.11), V(-4.4, 0, s * 0.11));
  else pts.push(V(-4.6, 0, s * 0.3));
  pts.push(V(-3.3, 0.04, s * 0.32), V(-2.6, 0.34, s * 0.36), V(-1.9, 0.34, s * 0.42), V(-1.2, 0.05, s * 0.55), V(xIn, 0, s * 0.58));
  return pts;
}

const CAN = { x: 0.3, depth: 1.0, h: 0.44 };

/* ---------- Voiture ville : cat-back titane, résonateurs, silencieux à valve, 2 × 2 sorties carbone ---------- */

function voitureVille(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  const xIn = CAN.x - CAN.depth / 2 + 0.05;
  for (const s of [-1, 1]) {
    g.add(tube(mainPath(s, xIn), 0.11, k.brushed));
    const flange = new THREE.Mesh(along(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 48)), k.satin);
    flange.position.set(-7.4, 0, s * 0.3);
    g.add(flange);
    resonator(k, g, -5.35, s * 0.3, 1.1, 0.2, 0.11, k.brushed);
    clamp(k, g, -3.45, 0.02, s * 0.32, 0.11);
    hanger(k, g, -6.6, 0.1, s * 0.3);
    hanger(k, g, -2.2, 0.44, s * 0.39);
  }
  const can = ovalCan(CAN.depth, CAN.h, 2.6, k.brushed);
  can.position.x = CAN.x;
  g.add(can);
  hanger(k, g, CAN.x - 0.15, CAN.h / 2, -1.05);
  hanger(k, g, CAN.x - 0.15, CAN.h / 2, 1.05);
  // valve pilotée sur l'entrée gauche
  const valve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.2), k.ceramic);
  valve.position.set(-0.75, 0.2, -0.57);
  g.add(valve, tube([V(-0.75, 0.28, -0.57), V(-1.3, 0.4, -0.5), V(-2.0, 0.5, -0.45)], 0.018, k.ceramic));
  plate(k, g, 1.1, V(CAN.x, CAN.h / 2 + 0.056, 0), Math.PI / 2, -Math.PI / 2);
  const x0 = CAN.x + CAN.depth / 2 - 0.12;
  const outs = [-1.0, -0.66, 0.66, 1.0].map((z) => tipX(k, g, x0, 0.55, 0.15, -0.02, z, k.carbon, k.titaneSmooth));
  return { root: normalize(g, 7.2), outlets: outs };
}

/* ---------- Voiture circuit : ligne décatalysée bleuie, X-pipe, silencieux course, 2 × 2 sorties titane brûlé ---------- */

function voitureCircuit(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  const xIn = CAN.x - CAN.depth / 2 + 0.05;
  for (const s of [-1, 1]) {
    g.add(tube(mainPath(s, xIn, true), 0.12, k.rainbowTube));
    const flange = new THREE.Mesh(along(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 48)), k.satin);
    flange.position.set(-7.4, 0, s * 0.3);
    g.add(flange);
    clamp(k, g, -3.45, 0.02, s * 0.32, 0.12);
    hanger(k, g, -6.6, 0.1, s * 0.3);
    hanger(k, g, -2.2, 0.45, s * 0.39);
  }
  // jonction X-pipe
  const x = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16), k.burntBox);
  x.position.set(-4.65, 0, 0);
  x.scale.set(1.9, 0.55, 0.85);
  g.add(x);
  const can = ovalCan(CAN.depth * 0.9, CAN.h, 2.7, Object.assign(k.burntBox.clone(), { roughness: 0.48, color: new THREE.Color("#c2c6dc") }));
  can.position.x = CAN.x;
  g.add(can);
  hanger(k, g, CAN.x - 0.15, CAN.h / 2, -1.1);
  hanger(k, g, CAN.x - 0.15, CAN.h / 2, 1.1);
  plate(k, g, 1.1, V(CAN.x, CAN.h / 2 + 0.056, 0), Math.PI / 2, -Math.PI / 2);
  const x0 = CAN.x + (CAN.depth * 0.9) / 2 - 0.12;
  const outs = [-1.06, -0.66, 0.66, 1.06].map((z) => tipX(k, g, x0, 0.6, 0.19, -0.02, z, k.burntTip, k.titaneSmooth));
  return { root: normalize(g, 7.2), outlets: outs };
}

/** Construit les 4 modèles. Les pots voiture sont présentés de 3/4 arrière pour montrer les sorties. */
export function buildModels(m: Mats): Record<Vehicle, Record<Finish, ExhaustModel>> {
  const k: Kit = { ...m, ...extraMaterials(m) };
  const wrapCar = (model: ExhaustModel): ExhaustModel => {
    const holder = new THREE.Group();
    model.root.rotation.set(0.42, -1.0, 0); // 3/4 arrière légèrement plongeant : toute la ligne et les 4 sorties
    holder.add(model.root);
    return { root: holder, outlets: model.outlets };
  };
  return {
    moto: { route: motoVille(k), circuit: motoCircuit(k) },
    voiture: { route: wrapCar(voitureVille(k)), circuit: wrapCar(voitureCircuit(k)) },
  };
}
