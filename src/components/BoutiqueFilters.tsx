"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { VehicleMake, VehicleModel } from "@/lib/types";

type Props = { makes: VehicleMake[]; models: VehicleModel[]; current: Record<string, string | undefined> };

export default function BoutiqueFilters({ makes, models, current }: Props) {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();

  // Chaque filtre réécrit l'URL ; changer un parent réinitialise ses enfants
  const set = (patch: Record<string, string | undefined>) => {
    const next = { ...current, ...patch };
    if ("type" in patch) Object.assign(next, { make: undefined, model: undefined, year: undefined });
    if ("make" in patch) Object.assign(next, { model: undefined, year: undefined });
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    start(() => router.push(`${path}?${qs}`, { scroll: false }));
  };

  const typeMakes = makes.filter((m) => !current.type || m.type === current.type);
  const makeModels = models.filter((m) => String(m.make_id) === current.make);
  const active = Object.entries(current).filter(([, v]) => v).length;

  return (
    <div className={`glass rounded-md p-4 transition-opacity md:p-5 ${pending ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <label className="col-span-2 md:col-span-1">
          <span className="label">Véhicule</span>
          <select className="field" value={current.type ?? ""} onChange={(e) => set({ type: e.target.value || undefined })}>
            <option value="">Tous</option>
            <option value="voiture">Voiture</option>
            <option value="moto">Moto</option>
          </select>
        </label>
        <label>
          <span className="label">Marque</span>
          <select className="field" value={current.make ?? ""} onChange={(e) => set({ make: e.target.value || undefined })}>
            <option value="">Toutes</option>
            {typeMakes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {!current.type ? `(${m.type})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Modèle</span>
          <select className="field disabled:opacity-40" disabled={!current.make} value={current.model ?? ""} onChange={(e) => set({ model: e.target.value || undefined })}>
            <option value="">Tous</option>
            {makeModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Matériau</span>
          <select className="field" value={current.material ?? ""} onChange={(e) => set({ material: e.target.value || undefined })}>
            <option value="">Tous</option>
            <option value="titane">Titane</option>
            <option value="inox">Inox</option>
            <option value="carbone">Carbone</option>
          </select>
        </label>
        <label>
          <span className="label">Usage</span>
          <select className="field" value={current.usage ?? ""} onChange={(e) => set({ usage: e.target.value || undefined })}>
            <option value="">Tous</option>
            <option value="route">Homologué route</option>
            <option value="circuit">Circuit</option>
          </select>
        </label>
        <label>
          <span className="label">Prix min</span>
          <input
            className="field"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            placeholder="0 €"
            defaultValue={current.min}
            onBlur={(e) => e.target.value !== (current.min ?? "") && set({ min: e.target.value || undefined })}
          />
        </label>
        <label>
          <span className="label">Prix max</span>
          <input
            className="field"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            placeholder="5 000 €"
            defaultValue={current.max}
            onBlur={(e) => e.target.value !== (current.max ?? "") && set({ max: e.target.value || undefined })}
          />
        </label>
        <label>
          <span className="label">Trier</span>
          <select className="field" value={current.sort ?? ""} onChange={(e) => set({ sort: e.target.value || undefined })}>
            <option value="">Référence</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
            <option value="ch">Gain en ch</option>
            <option value="db">Niveau sonore</option>
          </select>
        </label>
      </div>
      {active > 0 && (
        <button onClick={() => start(() => router.push(path))} className="mt-3 font-mono text-xs text-rouge hover:underline">
          × Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
