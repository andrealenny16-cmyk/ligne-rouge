import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* Modèles 3D procéduraux du hero : pot d'échappement + quincaillerie titane. */

export type Finish = "route" | "circuit";

export function makeRenderer(canvas: HTMLCanvasElement, pixelRatio: number) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return { renderer, envMap };
}

function carbonTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#141416";
  g.fillRect(0, 0, 128, 128);
  const s = 16;
  for (let y = 0; y < 128; y += s) {
    for (let x = 0; x < 128; x += s) {
      const odd = ((x + y) / s) % 2 === 0;
      const grad = odd ? g.createLinearGradient(x, y, x + s, y) : g.createLinearGradient(x, y, x, y + s);
      grad.addColorStop(0, "#1c1c1f");
      grad.addColorStop(0.5, "#3a3a40");
      grad.addColorStop(1, "#1c1c1f");
      g.fillStyle = grad;
      g.fillRect(x + 1, y + 1, s - 2, s - 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function engravingTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 192;
  const g = c.getContext("2d")!;
  g.font = "900 92px Arial Black, Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.letterSpacing = "10px";
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.fillText("LIGNE ROUGE", 512, 100);
  g.fillStyle = "rgba(10,10,12,0.75)";
  g.fillText("LIGNE ROUGE", 512, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function materials(envMap: THREE.Texture) {
  const base = { envMap, envMapIntensity: 1.2 };
  const carbonMap = carbonTexture();
  carbonMap.repeat.set(3, 1);
  return {
    titane: new THREE.MeshPhysicalMaterial({ ...base, color: "#d4d1c9", metalness: 1, roughness: 0.26, clearcoat: 0.4, flatShading: true }),
    bleu: new THREE.MeshPhysicalMaterial({
      ...base,
      color: "#6f82e8",
      metalness: 1,
      roughness: 0.2,
      iridescence: 1,
      iridescenceIOR: 1.9,
      iridescenceThicknessRange: [250, 900],
      flatShading: true,
    }),
    pipe: new THREE.MeshPhysicalMaterial({
      ...base,
      color: "#cfc8bd",
      metalness: 1,
      roughness: 0.3,
      iridescence: 0.7,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [300, 700],
    }),
    satin: new THREE.MeshPhysicalMaterial({ ...base, color: "#a9a59d", metalness: 1, roughness: 0.45 }),
    carbon: new THREE.MeshPhysicalMaterial({ ...base, map: carbonMap, metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }),
    bore: new THREE.MeshStandardMaterial({ color: "#050505", roughness: 0.9, side: THREE.DoubleSide }),
    engraving: new THREE.MeshStandardMaterial({
      map: engravingTexture(),
      transparent: true,
      metalness: 0.5,
      roughness: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  };
}

type Mats = ReturnType<typeof materials>;

/** Pot d'échappement : corps hexagonal, double embout carbone, brides titane, collier. Axe = X. */
export function buildExhaust(m: Mats) {
  const root = new THREE.Group();
  const R = 0.66;
  const L = 3.2;

  const along = (geo: THREE.BufferGeometry) => geo.rotateZ(-Math.PI / 2);

  // Corps hexagonal (une face à plat vers la caméra)
  const body = new THREE.Mesh(along(new THREE.CylinderGeometry(R, R, L, 6, 1, false, Math.PI / 6)), m.titane);
  root.add(body);

  // Gravure sur la face avant
  const apothem = R * Math.cos(Math.PI / 6);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.39), m.engraving);
  plate.position.set(0.25, 0, apothem + 0.002);
  root.add(plate);

  // Cône d'entrée + flasque arrière carbone
  const cone = new THREE.Mesh(along(new THREE.CylinderGeometry(R, 0.3, 0.45, 6, 1, false, Math.PI / 6)), m.titane);
  cone.position.x = -L / 2 - 0.225;
  root.add(cone);
  const cap = new THREE.Mesh(along(new THREE.CylinderGeometry(R * 0.98, R * 0.98, 0.12, 6, 1, false, Math.PI / 6)), m.carbon);
  cap.position.x = L / 2 + 0.06;
  root.add(cap);

  // Tube d'entrée + bride titane à 3 boulons
  const pipe = new THREE.Mesh(along(new THREE.CylinderGeometry(0.21, 0.21, 2.1, 40)), m.pipe);
  pipe.position.x = -L / 2 - 0.45 - 1.0;
  root.add(pipe);
  const flange = new THREE.Mesh(along(new THREE.CylinderGeometry(0.42, 0.42, 0.09, 40)), m.satin);
  flange.position.x = -L / 2 - 1.15;
  root.add(flange);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const bolt = new THREE.Mesh(along(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6)), m.titane);
    bolt.position.set(-L / 2 - 1.15, Math.cos(a) * 0.33, Math.sin(a) * 0.33);
    root.add(bolt);
  }

  // Collier de fixation
  const clamp = new THREE.Mesh(along(new THREE.CylinderGeometry(R + 0.04, R + 0.04, 0.2, 6, 1, false, Math.PI / 6)), m.satin);
  clamp.position.x = -L / 2 + 0.55;
  root.add(clamp);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.18), m.satin);
  tab.position.set(-L / 2 + 0.55, R + 0.16, 0);
  root.add(tab);
  const tabBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 12).rotateX(Math.PI / 2), m.titane);
  tabBolt.position.set(-L / 2 + 0.55, R + 0.2, 0);
  root.add(tabBolt);

  // Double embout carbone avec lèvre titane
  [-0.27, 0.27].forEach((y, i) => {
    const r = 0.27;
    const len = 0.95;
    const x = L / 2 + 0.12 + len / 2;
    const z = i ? 0.06 : -0.06;
    const tip = new THREE.Mesh(along(new THREE.CylinderGeometry(r, r * 0.94, len, 40, 1, true)), m.carbon);
    tip.position.set(x, y, z);
    root.add(tip);
    const bore = new THREE.Mesh(along(new THREE.CylinderGeometry(r * 0.84, r * 0.84, len * 0.98, 32, 1, true)), m.bore);
    bore.position.set(x, y, z);
    root.add(bore);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 0.93, 0.04, 16, 48).rotateY(Math.PI / 2), m.pipe);
    lip.position.set(x + len / 2, y, z);
    root.add(lip);
  });

  root.position.x = -0.35; // recentre la silhouette (le tube allonge la gauche)
  return { root, body, cone, cap };
}

/* ---------------- Quincaillerie flottante ---------------- */

function nutGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a);
    const y = Math.sin(a);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.5, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: 24 });
  g.center();
  return g;
}

function washerGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.55, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 40 });
  g.center();
  return g;
}

export type PartKind = "nut" | "bolt" | "clamp" | "washer";

export function buildPart(kind: PartKind, mat: THREE.Material) {
  const g = new THREE.Group();
  if (kind === "nut") g.add(new THREE.Mesh(nutGeometry(), mat));
  if (kind === "washer") g.add(new THREE.Mesh(washerGeometry(), mat));
  if (kind === "bolt") {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 6), mat);
    head.position.y = 0.95;
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 32), mat);
    flange.position.y = 0.68;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.7, 24), mat);
    shaft.position.y = -0.2;
    for (let i = 0; i < 7; i++) {
      const thread = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 24).rotateX(Math.PI / 2), mat);
      thread.position.y = -0.95 + i * 0.2;
      g.add(thread);
    }
    g.add(head, flange, shaft);
    g.scale.setScalar(0.8);
  }
  if (kind === "clamp") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 14, 56, Math.PI * 1.85), mat);
    ring.rotation.z = Math.PI * 0.575;
    const tab1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.3), mat);
    tab1.position.set(-0.13, 0.98, 0);
    const tab2 = tab1.clone();
    tab2.position.x = 0.13;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12).rotateZ(Math.PI / 2), mat);
    screw.position.set(0, 1.02, 0);
    g.add(ring, tab1, tab2, screw);
  }
  return g;
}

export function partMaterial(envMap: THREE.Texture, finish: Finish, opacity = 1) {
  return finish === "route"
    ? new THREE.MeshPhysicalMaterial({ envMap, color: "#d9d6ce", metalness: 1, roughness: 0.25, clearcoat: 0.5, transparent: true, opacity })
    : new THREE.MeshPhysicalMaterial({
        envMap,
        color: "#7385ec",
        metalness: 1,
        roughness: 0.2,
        iridescence: 1,
        iridescenceIOR: 1.9,
        iridescenceThicknessRange: [250, 900],
        transparent: true,
        opacity,
      });
}
