"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "User already registered": "Un compte existe déjà avec cet email.",
  "Email not confirmed": "Confirme ton email via le lien reçu, puis connecte-toi.",
};

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/compte";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setLoading(true);
    setError("");
    setInfo("");
    const supabase = createClient();

    if (mode === "signup") {
      const full_name = String(f.get("full_name")).trim();
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } });
      if (error) {
        setLoading(false);
        return setError(ERRORS[error.message] ?? error.message);
      }
      if (!data.session) {
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) {
          setLoading(false);
          return setInfo("Compte créé ! Confirme ton email via le lien reçu, puis connecte-toi.");
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return setError(ERRORS[error.message] ?? error.message);
      }
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} method="post" className="glass space-y-4 rounded-md p-6 md:p-8">
      {mode === "signup" && (
        <label className="block">
          <span className="label">Prénom et nom</span>
          <input name="full_name" required autoComplete="name" className="field" />
        </label>
      )}
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <label className="block">
        <span className="label">Mot de passe</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="field"
        />
        {mode === "signup" && <span className="mt-1 block text-xs text-neutral-400">8 caractères minimum</span>}
      </label>
      {error && <p role="alert" className="text-sm text-rouge">{error}</p>}
      {info && <p role="status" className="text-sm text-legal">{info}</p>}
      <button disabled={loading} className="bg-heat w-full rounded-md py-3.5 font-semibold transition hover:-translate-y-0.5 disabled:opacity-60">
        {loading ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        {mode === "signup" ? (
          <>Déjà client ? <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="text-rouge underline">Se connecter</Link></>
        ) : (
          <>Nouveau ? <Link href={`/inscription?next=${encodeURIComponent(next)}`} className="text-rouge underline">Créer un compte</Link></>
        )}
      </p>
    </form>
  );
}
