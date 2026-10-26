import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { Page, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Inscription" };

export default function InscriptionPage() {
  return (
    <Page className="max-w-lg">
      <PageTitle kicker="Rejoindre LIGNE ROUGE" title="Crée ton" accent="compte">
        Panier sauvegardé, garage personnel, suivi de commandes et recommandations sur mesure.
      </PageTitle>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </Page>
  );
}
