"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { VehicleMake, VehicleModel, VehicleType } from "@/lib/types";

type Props = { makes: VehicleMake[]; models: VehicleModel[]; compact?: boolean };

export default function VehicleSelector({ makes, models, compact = false }: Props) {
  const router = useRouter();
  const [type, setType] = useState<VehicleType>("voiture");
  const [makeId, setMakeId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");

  const typeMakes = useMemo(() => makes.filter((m) => m.type === type), [makes, type]);
  const makeModels = useMemo(() => models.filter((m) => m.make_id === makeId), [models, makeId]);
  const model = models.find((m) => m.id === modelId);
  const years = useMemo(() => {
    if (!model) return [];
    const to = model.year_to ?? 2026;
    return Array.from({ length: to - model.year_from + 1 }, (_, i) => to - i);
  }, [model]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId) return;
    router.push(`/boutique?model=${modelId}${year ? `&year=${year}` : ""}`);
  };

  return (
    <form onSubmit={submit} className={`grid gap-3 ${compact ? "" : "md:grid-cols-[auto_1fr_1fr_0.7fr_auto]"} md:items-end`}>
      <div>
        <span className="label">Type</span>
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          {(["voiture", "moto"] as VehicleType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setMakeId("");
                setModelId("");
                setYear("");
              }}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition ${
                type === t ? "bg-bronze text-ink" : "text-white/70 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <label>
        <span className="label">Marque</span>
        <select
          className="field"
          value={makeId}
          onChange={(e) => {
            setMakeId(e.target.value ? Number(e.target.value) : "");
            setModelId("");
            setYear("");
          }}
        >
          <option value="">Choisir…</option>
          {typeMakes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Modèle</span>
        <select
          className="field disabled:opacity-40"
          value={modelId}
          disabled={!makeId}
          onChange={(e) => {
            setModelId(e.target.value ? Number(e.target.value) : "");
            setYear("");
          }}
        >
          <option value="">Choisir…</option>
          {makeModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.generation ? `(${m.generation})` : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Année</span>
        <select className="field disabled:opacity-40" value={year} disabled={!modelId} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Toutes</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={!modelId}
        className="bg-heat h-[50px] rounded-full px-7 font-bold transition hover:-translate-y-0.5 disabled:opacity-40"
      >
        Trouver mon pot
      </button>
    </form>
  );
}
