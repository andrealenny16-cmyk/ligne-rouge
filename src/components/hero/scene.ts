import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* Pot d'échappement 3D du hero, rendu photoréaliste :
   éclairage par photo HDRI de studio (public/hdri/studio.hdr, Poly Haven CC0), matériaux PBR
   (titane brossé anisotrope, carbone verni, tubes bleuis par la chaleur, soudures), plaque de marque rivetée.
   Un vrai modèle public/models/exhaust.glb, s'il existe, remplace le modèle procédural. */

export type Finish = "route" | "circuit";

export function makeRenderer(canvas: HTMLCanvasElement, pixelRatio: number) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Environnement provisoire le temps de charger la vraie HDRI
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return { renderer, envMap };
}

/** Charge la photo HDRI de studio et la convertit pour l'éclairage PBR. */
export function loadStudio(renderer: THREE.WebGLRenderer): Promise<THREE.Texture | null> {
  return new HDRLoader()
    .loadAsync("/hdri/studio.hdr")
    .then((hdr) => {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      return env;
    })
    .catch(() => null);
}

/* ---------- Textures générées (micro-détails) ---------- */

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, color = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Stries de brossage (rugosité) : lignes fines dans le sens de la longueur. */
function brushedRoughness() {
  return canvasTexture(
    1024,
    256,
    (g) => {
      g.fillStyle = "#6e6e6e";
      g.fillRect(0, 0, 1024, 256);
      for (let i = 0; i < 2600; i++) {
        const y = Math.random() * 256;
        const v = 80 + Math.random() * 90;
        g.strokeStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.35})`;
        g.lineWidth = Math.random() * 1.2;
        g.beginPath();
        const x = Math.random() * 1024;
        g.moveTo(x, y);
        g.lineTo(x + 200 + Math.random() * 700, y + (Math.random() - 0.5) * 0.6);
        g.stroke();
      }
    },
    false,
  );
}

/** Coloration du titane chauffé : brut au centre, or puis bleu et violet vers les soudures (axe V). */
function heatTint() {
  return canvasTexture(16, 512, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#5a5fc4");
    grad.addColorStop(0.08, "#8a5bc0");
    grad.addColorStop(0.16, "#c9a35a");
    grad.addColorStop(0.28, "#cfc9bf");
    grad.addColorStop(0.72, "#cfc9bf");
    grad.addColorStop(0.84, "#c9a35a");
    grad.addColorStop(0.92, "#8a5bc0");
    grad.addColorStop(1, "#5a5fc4");
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 512);
  });
}

/** Sergé de carbone 2x2 avec reflets de fibres. */
function carbonWeave() {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = "#0b0b0d";
    g.fillRect(0, 0, 256, 256);
    const s = 16;
    for (let y = 0; y < 256; y += s) {
      for (let x = 0; x < 256; x += s) {
        const along = ((x / s + Math.floor(y / s / 2)) % 2) === 0;
        const grad = along ? g.createLinearGradient(x, y, x + s * 2, y) : g.createLinearGradient(x, y, x, y + s * 2);
        grad.addColorStop(0, "#141417");
        grad.addColorStop(0.5, "#3b3b42");
        grad.addColorStop(1, "#141417");
        g.fillStyle = grad;
        g.fillRect(x + 0.5, y + 0.5, along ? s * 2 - 1 : s - 1, along ? s - 1 : s * 2 - 1);
      }
    }
  });
}

/** Plaque de marque : le vrai logo vectoriel LIGNE ROUGE rasterisé. */
function brandPlate(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 560;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    c.getContext("2d")!.drawImage(img, 0, 0, 1280, 560);
    t.needsUpdate = true;
  };
  img.src = "/brand/ligne-rouge-plaque.svg";
  return t;
}

export function materials(_envMap?: THREE.Texture) {
  const brushed = brushedRoughness();
  brushed.repeat.set(1, 2);
  const carbonMap = carbonWeave();
  carbonMap.repeat.set(6, 2);
  const brushedPipe = brushed.clone();
  brushedPipe.repeat.set(1, 6);
  return {
    titane: new THREE.MeshPhysicalMaterial({
      color: "#dcd8d0",
      metalness: 1,
      roughness: 0.34,
      roughnessMap: brushed,
      anisotropy: 0.75,
      clearcoat: 0.15,
      clearcoatRoughness: 0.3,
    }),
    bleu: new THREE.MeshPhysicalMaterial({
      color: "#7f8fe0",
      metalness: 1,
      roughness: 0.36,
      roughnessMap: brushed,
      anisotropy: 0.6,
      iridescence: 1,
      iridescenceIOR: 1.9,
      iridescenceThicknessRange: [250, 900],
    }),
    pipe: new THREE.MeshPhysicalMaterial({
      map: heatTint(),
      metalness: 1,
      roughness: 0.38,
      roughnessMap: brushedPipe,
      anisotropy: 0.5,
      iridescence: 0.35,
      iridescenceThicknessRange: [300, 700],
    }),
    satin: new THREE.MeshPhysicalMaterial({ color: "#9d9991", metalness: 1, roughness: 0.55, roughnessMap: brushed }),
    weld: new THREE.MeshStandardMaterial({ color: "#8d7f73", metalness: 1, roughness: 0.65 }),
    carbon: new THREE.MeshPhysicalMaterial({
      map: carbonMap,
      metalness: 0.1,
      roughness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      sheen: 0.4,
      sheenColor: new THREE.Color("#5a5a66"),
    }),
    bore: new THREE.MeshStandardMaterial({ color: "#060606", roughness: 0.95, side: THREE.DoubleSide }),
    plate: new THREE.MeshPhysicalMaterial({ map: brandPlate(), transparent: true, metalness: 0.6, roughness: 0.35, clearcoat: 0.3 }),
    engraving: new THREE.MeshStandardMaterial({ visible: false }),
  };
}

type Mats = ReturnType<typeof materials>;

const along = (geo: THREE.BufferGeometry) => geo.rotateZ(-Math.PI / 2);

function weld(m: Mats, x: number, r: number, root: THREE.Object3D, y = 0, z = 0) {
  const bead = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 10, 64).rotateY(Math.PI / 2), m.weld);
  bead.position.set(x, y, z);
  root.add(bead);
}

/** Silencieux ovale à manchon, flasques carbone, double sortie, ligne d'entrée bleuie. Axe = X. */
export function buildExhaust(m: Mats) {
  const root = new THREE.Group();
  const R = 0.72;
  const OVAL = 0.74; // écrasement vertical du corps
  const L = 3.1;

  // Manchon principal ovale (titane brossé ou bleu chauffe)
  const body = new THREE.Mesh(along(new THREE.CylinderGeometry(R, R, L, 96, 1, true)), m.titane);
  body.scale.y = OVAL;
  root.add(body);

  // Bagues de jonction titane + rivets aux deux extrémités du manchon
  for (const x of [-L / 2, L / 2]) {
    const band = new THREE.Mesh(along(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.12, 96)), m.satin);
    band.position.x = x;
    band.scale.y = OVAL;
    root.add(band);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), m.titane);
      rivet.position.set(x, Math.sin(a) * (R + 0.035) * OVAL, Math.cos(a) * (R + 0.035));
      root.add(rivet);
    }
  }

  // Flasque avant conique (carbone) et flasque arrière (carbone)
  const cone = new THREE.Mesh(along(new THREE.CylinderGeometry(R, 0.3, 0.55, 96)), m.carbon);
  cone.position.x = -L / 2 - 0.275;
  cone.scale.y = OVAL;
  root.add(cone);
  const cap = new THREE.Mesh(along(new THREE.CylinderGeometry(R * 0.9, R, 0.22, 96)), m.carbon);
  cap.position.x = L / 2 + 0.11;
  cap.scale.y = OVAL;
  root.add(cap);

  // Plaque de marque rivetée sur le flanc
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.55), m.plate);
  plate.position.set(0.15, 0, R + 0.004);
  root.add(plate);

  // Tube d'entrée bleui + soudures + bride + collier V-band
  const pipeLen = 2.3;
  const pipeX = -L / 2 - 0.55 - pipeLen / 2;
  const pipe = new THREE.Mesh(along(new THREE.CylinderGeometry(0.2, 0.2, pipeLen, 64)), m.pipe);
  pipe.position.x = pipeX;
  root.add(pipe);
  weld(m, -L / 2 - 0.55, 0.205, root);
  const vband = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.045, 16, 64).rotateY(Math.PI / 2), m.satin);
  vband.position.x = pipeX - 0.3;
  root.add(vband);
  const flange = new THREE.Mesh(along(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 64)), m.satin);
  flange.position.x = pipeX - pipeLen / 2 + 0.05;
  root.add(flange);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const bolt = new THREE.Mesh(along(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 6)), m.titane);
    bolt.position.set(flange.position.x, Math.cos(a) * 0.33, Math.sin(a) * 0.33);
    root.add(bolt);
  }

  // Collier de fixation avec patte
  const clamp = new THREE.Mesh(along(new THREE.CylinderGeometry(R + 0.05, R + 0.05, 0.16, 96)), m.satin);
  clamp.position.x = -L / 2 + 0.6;
  clamp.scale.y = OVAL;
  root.add(clamp);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.16), m.satin);
  tab.position.set(-L / 2 + 0.6, R * OVAL + 0.16, 0);
  root.add(tab);

  // Double sortie : manchon carbone, lèvre titane, âme perforée sombre, soudure
  const outlets: THREE.Object3D[] = [];
  [-0.24, 0.24].forEach((y, i) => {
    const r = 0.27;
    const len = 0.9;
    const x = L / 2 + 0.2 + len / 2;
    const z = i ? 0.08 : -0.08;
    const tip = new THREE.Mesh(along(new THREE.CylinderGeometry(r, r * 0.96, len, 64, 1, true)), m.carbon);
    tip.position.set(x, y, z);
    root.add(tip);
    const bore = new THREE.Mesh(along(new THREE.CylinderGeometry(r * 0.82, r * 0.82, len * 0.98, 48, 1, true)), m.bore);
    bore.position.set(x, y, z);
    root.add(bore);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, 0.045, 20, 64).rotateY(Math.PI / 2), m.pipe);
    lip.position.set(x + len / 2, y, z);
    root.add(lip);
    weld(m, L / 2 + 0.22, r * 0.75, root, y, z);
    const outlet = new THREE.Object3D(); // point d'éjection de la quincaillerie
    outlet.position.set(x + len / 2 + 0.05, y, z);
    root.add(outlet);
    outlets.push(outlet);
  });

  root.position.x = -0.1;
  // Bascule route/circuit : seul le manchon change de finition (titane brut <-> bleu chauffe)
  return { root, body, cone: body, cap, outlets };
}

/** Charge un vrai modèle public/models/exhaust.glb s'il existe, normalisé à la taille du pot procédural. */
export async function loadExhaustModel(): Promise<THREE.Group | null> {
  const head = await fetch("/models/exhaust.glb", { method: "HEAD" }).catch(() => null);
  if (!head?.ok) return null;
  const gltf = await new GLTFLoader().loadAsync("/models/exhaust.glb").catch(() => null);
  if (!gltf) return null;
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z);
  model.position.sub(center);
  if (size.z === longest) model.rotation.y = Math.PI / 2;
  else if (size.y === longest) model.rotation.z = Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(model);
  holder.scale.setScalar(6.6 / longest);
  return holder;
}

/* ---------------- Quincaillerie flottante ---------------- */

export function nutGeometry() {
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
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 32 });
  g.center();
  return g;
}

export function washerGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.55, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 48 });
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
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 48), mat);
    flange.position.y = 0.68;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.7, 32), mat);
    shaft.position.y = -0.2;
    for (let i = 0; i < 7; i++) {
      const thread = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 8, 32).rotateX(Math.PI / 2), mat);
      thread.position.y = -0.95 + i * 0.2;
      g.add(thread);
    }
    g.add(head, flange, shaft);
    g.scale.setScalar(0.8);
  }
  if (kind === "clamp") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 18, 72, Math.PI * 1.85), mat);
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

export function partMaterial(_envMap: THREE.Texture, finish: Finish, opacity = 1) {
  return finish === "route"
    ? new THREE.MeshPhysicalMaterial({ color: "#c9c5bd", metalness: 1, roughness: 0.3, clearcoat: 0.3, transparent: true, opacity })
    : new THREE.MeshPhysicalMaterial({
        color: "#8494ec",
        metalness: 1,
        roughness: 0.25,
        iridescence: 1,
        iridescenceIOR: 1.9,
        iridescenceThicknessRange: [250, 900],
        transparent: true,
        opacity,
      });
}
