const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurCents = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const num = new Intl.NumberFormat("fr-FR");

export function formatPrice(value: number | string, cents = false) {
  const n = Number(value);
  return (cents || !Number.isInteger(n) ? eurCents : eur).format(n);
}

export function formatNumber(value: number | string) {
  return num.format(Number(value));
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatInstall(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export function finalPrice(p: { price: number; promo_price: number | null }) {
  return Number(p.promo_price ?? p.price);
}

export function discountPercent(p: { price: number; promo_price: number | null }) {
  if (!p.promo_price) return 0;
  return Math.round((1 - Number(p.promo_price) / Number(p.price)) * 100);
}
