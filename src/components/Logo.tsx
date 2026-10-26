/* Plaque rivetée LIGNE ROUGE — fichiers générés par scripts/gen-brand.mjs */
export default function Logo({ className = "h-10", variant = "titane" }: { className?: string; variant?: "titane" | "blanc" | "noir" }) {
  const src = variant === "titane" ? "/brand/ligne-rouge-plaque.svg" : `/brand/ligne-rouge-plaque-${variant}.svg`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="LIGNE ROUGE" width={640} height={280} className={`w-auto ${className}`} />;
}
