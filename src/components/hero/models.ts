import * as THREE from "three";
import type { materials } from "./scene";

/* Les 4 pots 3D du hero, tous différents et marqués LIGNE ROUGE :
   moto ville (slip-on hexagonal), moto circuit (ligne 4-en-1 type MotoGP),
   voiture ville (cat-back à valve, 4 sorties carbone), voiture circuit (ligne course bleuie, X-pipe).
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

/* ---------- Silencieux arrière voiture (section rectangle arrondi, extrudé selon X) ---------- */

function rearBox(w: number, h: number, depth: number, mat: THREE.Material) {
  const r = h * 0.45;
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 32 });
  geo.translate(0, 0, -depth / 2);
  geo.rotateY(Math.PI / 2); // largeur selon Z, profondeur selon X
  return new THREE.Mesh(geo, mat);
}

/* ---------- Voiture ville : cat-back à valve, double résonateur, 4 sorties carbone ---------- */

function voitureVille(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  for (const z of [-0.36, 0.36]) {
    g.add(tube([V(-3.6, 0.05, z * 0.8), V(-3.0, 0, z), V(-2.4, 0, z)], 0.16, k.heatTube));
    const res = new THREE.Mesh(along(new THREE.CylinderGeometry(0.3, 0.3, 1.3, 96)), k.titaneSmooth);
    res.position.set(-1.7, 0, z);
    g.add(res);
    for (const x of [-2.35, -1.05]) {
      const cone = new THREE.Mesh(along(new THREE.CylinderGeometry(x < -2 ? 0.3 : 0.17, x < -2 ? 0.17 : 0.3, 0.12, 64)), k.titaneSmooth);
      cone.position.set(x + (x < -2 ? 0 : 0), 0, z);
      g.add(cone);
      weldX(k, g, x, 0.3, 0, z);
    }
    g.add(tube([V(-1.0, 0, z), V(-0.6, 0, z * 1.15), V(-0.25, 0, z * 1.35)], 0.16, k.heatTube));
  }
  // silencieux arrière transversal + valve pilotée
  const box = rearBox(2.5, 0.72, 1.0, k.titaneSmooth);
  box.position.x = 0.35;
  g.add(box);
  const valve = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.28), k.ceramic);
  valve.position.set(0.05, 0.47, 0.7);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 24).rotateX(Math.PI / 2), k.ceramic);
  motor.position.set(0.05, 0.47, 0.95);
  g.add(valve, motor, tube([V(0.05, 0.55, 1.0), V(-0.4, 0.75, 1.1), V(-1.0, 0.7, 1.15)], 0.022, k.ceramic));
  // plaque de marque sur le dessus du silencieux (face visible en vue plongeante)
  plate(k, g, 1.1, V(0.35, 0.425, -0.35), Math.PI / 2, -Math.PI / 2);
  // 4 sorties carbone Ø 102
  const outs = [-0.92, -0.42, 0.42, 0.92].map((z) => tipX(k, g, 0.9, 0.62, 0.2, -0.04, z, k.carbon, k.heatTube));
  return { root: normalize(g, 5.6), outlets: outs };
}

/* ---------- Voiture circuit : ligne course bleuie, X-pipe, bouclier carbone, 4 sorties titane ---------- */

function voitureCircuit(k: Kit): ExhaustModel {
  const g = new THREE.Group();
  // X-pipe
  g.add(tube([V(-3.6, 0, 0.36), V(-3.0, 0, 0.36), V(-2.55, 0, 0), V(-2.1, 0, -0.36), V(-0.6, 0, -0.4), V(-0.25, 0, -0.5)], 0.19, k.rainbowTube));
  g.add(tube([V(-3.6, 0, -0.36), V(-3.0, 0, -0.36), V(-2.55, 0, 0), V(-2.1, 0, 0.36), V(-0.6, 0, 0.4), V(-0.25, 0, 0.5)], 0.19, k.rainbowTube));
  const xclamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 16), k.burntBox);
  xclamp.position.set(-2.55, 0, 0);
  xclamp.scale.set(1.2, 0.9, 1.1);
  g.add(xclamp);
  for (const z of [-0.4, 0.4]) {
    const vb = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.045, 14, 48).rotateY(Math.PI / 2), k.satin);
    vb.position.set(-1.4, 0, z);
    g.add(vb);
  }
  // silencieux course bleui + bouclier thermique carbone riveté
  const box = rearBox(2.6, 0.66, 0.85, k.burntBox);
  box.position.x = 0.3;
  const shield = rearBox(2.75, 0.08, 1.0, k.carbon);
  shield.position.set(0.3, 0.42, 0);
  g.add(box, shield);
  for (let i = 0; i < 8; i++) {
    const rv = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), k.titane);
    rv.position.set(i % 2 ? -0.12 : 0.72, 0.47, -1.15 + Math.floor(i / 2) * 0.77);
    g.add(rv);
  }
  plate(k, g, 1.1, V(0.3, 0.535, 0.2), Math.PI / 2, -Math.PI / 2); // sur le bouclier carbone
  // 4 grosses sorties titane brûlé Ø 115
  const outs = [-0.95, -0.42, 0.42, 0.95].map((z) => tipX(k, g, 0.78, 0.6, 0.24, -0.02, z, k.burntTip, k.titaneSmooth));
  return { root: normalize(g, 5.6), outlets: outs };
}

/** Construit les 4 modèles. Les pots voiture sont présentés de 3/4 arrière pour montrer les sorties. */
export function buildModels(m: Mats): Record<Vehicle, Record<Finish, ExhaustModel>> {
  const k: Kit = { ...m, ...extraMaterials(m) };
  const wrapCar = (model: ExhaustModel): ExhaustModel => {
    const holder = new THREE.Group();
    model.root.rotation.set(0.95, -0.5, 0); // vue plongeante 3/4 arrière : toute la ligne et les 4 sorties
    holder.add(model.root);
    return { root: holder, outlets: model.outlets };
  };
  return {
    moto: { route: motoVille(k), circuit: motoCircuit(k) },
    voiture: { route: wrapCar(voitureVille(k)), circuit: wrapCar(voitureCircuit(k)) },
  };
}
