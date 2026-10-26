import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Logo className="h-16" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-400">
            Échappements titane, inox et carbone conçus et soudés en France pour voitures et motos. Homologués route ou réservés au circuit.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Boutique</p>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li><Link className="hover:text-white" href="/boutique?type=voiture">Échappements voiture</Link></li>
            <li><Link className="hover:text-white" href="/boutique?type=moto">Échappements moto</Link></li>
            <li><Link className="hover:text-white" href="/boutique?usage=circuit">Gamme circuit</Link></li>
            <li><Link className="hover:text-white" href="/configurateur">Conseil sur mesure</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Service client</p>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li>Livraison offerte dès 500 €</li>
            <li>Garantie 2 ans pièces et soudures</li>
            <li>Paiement en 4x sans frais</li>
            <li><Link className="hover:text-white" href="/compte">Mon compte</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-neutral-500 md:px-8">
          © 2026 LIGNE ROUGE · Projet étudiant : marque fictive, paiement simulé. Les produits « Circuit uniquement » sont réservés à un usage sur circuit fermé.
        </p>
      </div>
    </footer>
  );
}
