import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { Page, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <Page className="max-w-lg">
      <PageTitle kicker="Espace client" title="Content de te" accent="revoir">
        Ton panier, ton garage et tes commandes t&apos;attendent.
      </PageTitle>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </Page>
  );
}
