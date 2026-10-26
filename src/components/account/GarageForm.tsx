"use client";

import { useActionState, useMemo, useState } from "react";
import { addGarageVehicle } from "@/app/actions";
import type { VehicleMake, VehicleModel } from "@/lib/types";

export default function GarageForm({ makes, models }: { makes: VehicleMake[]; models: VehicleModel[] }) {
  const [state, action, pending] = useActionState(addGarageVehicle, null);
  const [makeId, setMakeId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const model = models.find((m) => m.id === modelId);
  const years = useMemo(() => {
    if (!model) return [];
    const to = model.year_to ?? 2026;
    return Array.from({ length: to - model.year_from + 1 }, (_, i) => to - i);
  }, [model]);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <label>
        <span className="label">Marque</span>
        <select className="field" value={makeId} onChange={(e) => { setMakeId(Number(e.target.value) || ""); setModelId(""); }}>
          <option value="">Choisir…</option>
          {makes.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.type})</option>)}
        </select>
      </label>
      <label>
        <span className="label">Modèle</span>
        <select name="model_id" className="field" required value={modelId} disabled={!makeId} onChange={(e) => setModelId(Number(e.target.value) || "")}>
          <option value="">Choisir…</option>
          {models.filter((m) => m.make_id === makeId).map((m) => <option key={m.id} value={m.id}>{m.name} {m.generation}</option>)}
        </select>
      </label>
      <label>
        <span className="label">Année</span>
        <select name="year" className="field" required disabled={!modelId}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <label>
        <span className="label">Surnom</span>
        <input name="nickname" className="field" placeholder="ex. La grise" maxLength={40} />
      </label>
      <button disabled={pending || !modelId} className="h-[48px] rounded-md bg-rouge px-6 font-semibold text-white disabled:opacity-40">
        {pending ? "…" : "Ajouter"}
      </button>
      {state && !state.ok && <p className="text-sm text-rouge sm:col-span-2">{state.error}</p>}
    </form>
  );
}
