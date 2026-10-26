import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="carbon relative mt-24 border-t border-white/10">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Logo className="h-16" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            Échappements titane, inox et carbone conçus en France pour voitures et motos. Homologués route ou pensés pour la piste.
          </p>
          <p className="mt-6 font-mono text-[0.65rem] tracking-widest text-white/35">
            PROJET ÉTUDIANT · MARQUE FICTIVE · PAIEMENT SIMULÉ
          </p>
        </div>
        <div>
          <p className="label">Boutique</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link className="hover:text-bronze" href="/boutique?type=voiture">Voitures</Link></li>
            <li><Link className="hover:text-bronze" href="/boutique?type=moto">Motos</Link></li>
            <li><Link className="hover:text-bronze" href="/boutique?usage=circuit">Gamme circuit</Link></li>
            <li><Link className="hover:text-bronze" href="/configurateur">Configurateur Son & Perf</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Service</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Livraison offerte dès 500 €</li>
            <li>Garantie 2 ans</li>
            <li>Paiement en 4x</li>
            <li><Link className="hover:text-bronze" href="/compte">Mon compte</Link></li>
          </ul>
        </div>
      </div>
      <div className="cote mx-4 md:mx-8" />
      <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-white/35 md:px-8">
        © 2026 DÉCIBEL Performance. Les produits « Circuit » sont réservés à un usage sur circuit fermé.
      </p>
    </footer>
  );
}
