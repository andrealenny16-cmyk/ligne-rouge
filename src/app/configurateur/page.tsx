import type { Metadata } from "next";
import ConfiguratorForm from "@/components/ConfiguratorForm";
import { Page, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Configurateur Son & Perf" };

export default function ConfigurateurPage() {
  return (
    <Page>
      <PageTitle kicker="Skill IA · Configurateur Son & Perf" title="Dis-nous ce que tu" accent="veux entendre">
        Décris ton véhicule et ton envie. On retrouve ton modèle, on filtre les pots compatibles, et l&apos;IA te recommande le bon, avec le
        gain estimé et le son décrit en mots. Règle d&apos;or : jamais de pot circuit pour un usage route.
      </PageTitle>
      <div className="glass rounded-[32px] p-5 md:p-8">
        <ConfiguratorForm />
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["1. Identification", "Ton texte est rapproché des 18 modèles de notre base (marque, nom, génération)."],
          ["2. Compatibilité", "Seuls les pots validés sur ton véhicule sont proposés, filtrés selon route ou circuit."],
          ["3. Recommandation", "L'IA rédige le conseil à partir des specs réelles. Sans clé API, un moteur à règles prend le relais."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-3xl border border-black/10 p-5">
            <p className="font-display text-2xl uppercase">{t}</p>
            <div className="cote my-3" />
            <p className="text-sm text-neutral-600">{d}</p>
          </div>
        ))}
      </div>
    </Page>
  );
}
