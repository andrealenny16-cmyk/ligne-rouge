import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { nutGeometry, washerGeometry } from "./scene";

/* Quincaillerie éjectée par les sorties du pot (comme les fruits qui jaillissent de la canette dans la
   référence Soda) : écrous, rondelles, boulons et vis en titane, instanciés pour rester fluides. */

const MAX_PER_KIND = 48;

function boltGeometry() {
  const head = new THREE.CylinderGeometry(0.75, 0.75, 0.5, 6).translate(0, 0.95, 0);
  const collar = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 32).translate(0, 0.68, 0);
  const shaft = new THREE.CylinderGeometry(0.34, 0.34, 1.7, 20).translate(0, -0.2, 0);
  const threads = Array.from({ length: 6 }, (_, i) => new THREE.TorusGeometry(0.34, 0.045, 6, 20).rotateX(Math.PI / 2).translate(0, -0.9 + i * 0.2, 0));
  return mergeGeometries([head, collar, shaft, ...threads].map((g) => g.toNonIndexed()))!.scale(0.55, 0.55, 0.55);
}

function screwGeometry() {
  const head = new THREE.CylinderGeometry(0.6, 0.6, 0.25, 24).translate(0, 0.9, 0);
  const shaft = new THREE.CylinderGeometry(0.22, 0.05, 1.6, 16).translate(0, 0, 0);
  return mergeGeometries([head, shaft].map((g) => g.toNonIndexed()))!.scale(0.5, 0.5, 0.5);
}

type Particle = {
  mesh: THREE.InstancedMesh;
  idx: number;
  alive: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  age: number;
  life: number;
  size: number;
};

export function createEmitter(scene: THREE.Scene, material: THREE.Material, initialOutlets: THREE.Object3D[]) {
  let outlets = initialOutlets;
  const kinds = [nutGeometry(), washerGeometry(), boltGeometry(), screwGeometry()].map((g) => {
    const mesh = new THREE.InstancedMesh(g, material, MAX_PER_KIND);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  });
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const pool: Particle[] = [];
  kinds.forEach((mesh) => {
    for (let i = 0; i < MAX_PER_KIND; i++) {
      mesh.setMatrixAt(i, zero);
      pool.push({ mesh, idx: i, alive: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Euler(), spin: new THREE.Vector3(), age: 0, life: 1, size: 0.1 });
    }
  });

  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  let acc = 0;

  function spawn() {
    const free = pool.filter((p) => !p.alive);
    if (!free.length || !outlets.length) return;
    const p = free[Math.floor(Math.random() * free.length)];
    const o = outlets[Math.floor(Math.random() * outlets.length)];
    o.getWorldPosition(tmpPos);
    o.getWorldQuaternion(tmpQuat);
    axis.set(1, 0, 0).applyQuaternion(tmpQuat).normalize();
    const speed = 2.2 + Math.random() * 2.6;
    p.pos.copy(tmpPos);
    p.vel
      .copy(axis)
      .multiplyScalar(speed)
      .add(new THREE.Vector3((Math.random() - 0.5) * 1.4, Math.random() * 1.6 - 0.2, 0.8 + Math.random() * 2.2)); // gerbe vers l'écran
    p.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    p.spin.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    p.age = 0;
    p.life = 1.8 + Math.random() * 1.8;
    p.size = 0.07 + Math.random() * 0.08;
    p.alive = true;
  }

  return {
    setOutlets(next: THREE.Object3D[]) {
      outlets = next;
    },
    setMaterial(next: THREE.Material) {
      kinds.forEach((k) => (k.material = next));
    },
    burst(n: number) {
      for (let i = 0; i < n; i++) spawn();
    },
    /** dt en secondes, rate en pièces par seconde */
    update(dt: number, rate: number) {
      acc += rate * dt;
      while (acc >= 1) {
        spawn();
        acc -= 1;
      }
      for (const p of pool) {
        if (!p.alive) continue;
        p.age += dt;
        if (p.age >= p.life) {
          p.alive = false;
          p.mesh.setMatrixAt(p.idx, zero);
          continue;
        }
        p.vel.y -= 2.4 * dt; // gravité
        p.vel.multiplyScalar(1 - 0.35 * dt); // freinage dans l'air
        p.pos.addScaledVector(p.vel, dt);
        p.rot.x += p.spin.x * dt;
        p.rot.y += p.spin.y * dt;
        p.rot.z += p.spin.z * dt;
        const grow = Math.min(1, p.age * 5);
        const fade = p.age > p.life - 0.35 ? (p.life - p.age) / 0.35 : 1;
        const s = p.size * grow * fade * (1 + p.age * 0.35); // grossit en venant vers l'écran
        q.setFromEuler(p.rot);
        sc.set(s, s, s);
        m.compose(p.pos, q, sc);
        p.mesh.setMatrixAt(p.idx, m);
      }
      kinds.forEach((k) => (k.instanceMatrix.needsUpdate = true));
    },
  };
}
