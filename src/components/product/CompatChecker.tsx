"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import type { VehicleMake, VehicleModel, VehicleType } from "@/lib/types";

type Props = {
  productId: string;
  compatibleIds: number[];
  garage: { id: string; model_id: number; label: string }[];
  vehicleType: VehicleType;
};

export default function CompatChecker({ productId, compatibleIds, garage, vehicleType }: Props) {
  const [open, setOpen] = useState(false);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makeId, setMakeId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">(garage[0]?.model_id ?? "");
  const [result, setResult] = useState<boolean | null>(null);

  // Référentiel véhicules chargé à la demande (lecture publique RLS)
  useEffect(() => {
    if (!open || makes.length) return;
    const sb = createClient();
    void Promise.all([
      sb.from("vehicle_makes").select("id, name, type").eq("type", vehicleType).order("name"),
      sb.from("vehicle_models").select("id, make_id, name, generation, year_from, year_to, engine, power_hp").order("name"),
    ]).then(([a, b]) => {
      setMakes((a.data ?? []) as VehicleMake[]);
      setModels((b.data ?? []) as VehicleModel[]);
    });
  }, [open, makes.length, vehicleType]);

  const check = (id: number) => {
    const ok = compatibleIds.includes(id);
    setResult(ok);
    void trackEvent("compat_check", productId, { model_id: id, compatible: ok });
  };

  return (
    <div className="glass rounded-3xl p-6">
      <p className="label">Compatibilité</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full rounded-2xl border border-bronze/50 bg-bronze/10 px-5 py-4 text-left font-semibold transition hover:bg-bronze/20">
          Vérifier la compatibilité avec mon véhicule →
        </button>
      ) : (
        <div className="space-y-3">
          {garage.length > 0 && (
            <label className="block">
              <span className="label">Depuis mon garage</span>
              <select
                className="field"
                value={modelId}
                onChange={(e) => {
                  setModelId(Number(e.target.value));
                  setResult(null);
                }}
              >
                {garage.map((g) => (
                  <option key={g.id} value={g.model_id}>
                    {g.label}
                  </option>
                ))}
                <option value="">Autre véhicule…</option>
              </select>
            </label>
          )}
          {(!garage.length || modelId === "" || !garage.some((g) => g.model_id === modelId)) && (
            <div className="grid grid-cols-2 gap-3">
              <select className="field" value={makeId} onChange={(e) => { setMakeId(Number(e.target.value) || ""); setModelId(""); setResult(null); }}>
                <option value="">Marque…</option>
                {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select className="field" value={modelId} onChange={(e) => { setModelId(Number(e.target.value) || ""); setResult(null); }} disabled={!makeId}>
                <option value="">Modèle…</option>
                {models.filter((m) => m.make_id === makeId).map((m) => <option key={m.id} value={m.id}>{m.name} {m.generation}</option>)}
              </select>
            </div>
          )}
          <button
            disabled={!modelId}
            onClick={() => modelId && check(modelId)}
            className="bg-heat w-full rounded-full py-3 font-bold transition disabled:opacity-40"
          >
            Vérifier
          </button>
          {result !== null && (
            <p role="status" className={`rounded-2xl p-4 text-sm font-semibold ${result ? "bg-legal/15 text-legal" : "bg-alert/15 text-alert"}`}>
              {result ? "✓ Compatible : montage sur fixations d'origine." : "✕ Non compatible avec ce véhicule. Essaie le configurateur pour trouver le bon pot."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
