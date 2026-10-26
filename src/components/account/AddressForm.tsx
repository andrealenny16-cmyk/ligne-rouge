"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addAddress } from "@/app/actions";

export default function AddressForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState(addAddress, null);
  const [open, setOpen] = useState(!compact);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold hover:border-rouge/60">
        + Nouvelle adresse
      </button>
    );

  return (
    <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2">
      <label><span className="label">Libellé</span><input name="label" className="field" placeholder="Domicile, Atelier…" /></label>
      <label><span className="label">Pays</span><input name="country" className="field" defaultValue="France" /></label>
      <label className="sm:col-span-2"><span className="label">Adresse</span><input name="line1" required className="field" autoComplete="street-address" /></label>
      <label><span className="label">Code postal</span><input name="zip" required className="field" autoComplete="postal-code" inputMode="numeric" /></label>
      <label><span className="label">Ville</span><input name="city" required className="field" autoComplete="address-level2" /></label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button disabled={pending} className="rounded-md bg-rouge px-6 py-2.5 font-semibold text-white disabled:opacity-50">
          {pending ? "…" : "Enregistrer l'adresse"}
        </button>
        {state && <span className={`text-sm ${state.ok ? "text-legal" : "text-rouge"}`}>{state.ok ? state.message : state.error}</span>}
      </div>
    </form>
  );
}
