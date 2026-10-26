export type VehicleType = "voiture" | "moto";
export type Usage = "route" | "circuit";
export type Material = "titane" | "inox" | "carbone";
export type OrderStatus = "payee" | "preparation" | "expediee" | "livree" | "annulee";

export type Variant = {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string;
  stock: number;
};

export type ProductImage = { url: string; alt: string | null; position: number };

export type Product = {
  id: string;
  ref: string;
  name: string;
  slug: string;
  vehicle_type: VehicleType;
  tagline: string | null;
  description: string;
  material: Material;
  usage: Usage;
  db_level: number;
  db_level_max: number | null;
  hp_gain: number;
  torque_gain: number;
  weight_saving_kg: number;
  install_minutes: number;
  price: number;
  promo_price: number | null;
  stock: number;
  is_active: boolean;
  categories?: { name: string; slug: string } | null;
  product_variants?: Variant[];
  product_images?: ProductImage[];
};

export type VehicleMake = { id: number; name: string; type: VehicleType };
export type VehicleModel = {
  id: number;
  make_id: number;
  name: string;
  generation: string | null;
  year_from: number;
  year_to: number | null;
  engine: string | null;
  power_hp: number | null;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  payee: "Payée",
  preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const CIRCUIT_WARNING =
  "Usage exclusif sur circuit fermé. Non homologué pour la circulation sur voie publique.";

export const PRODUCT_SELECT =
  "id, ref, name, slug, vehicle_type, tagline, description, material, usage, db_level, db_level_max, hp_gain, torque_gain, weight_saving_kg, install_minutes, price, promo_price, stock, is_active, categories(name, slug), product_variants(id, product_id, color_name, color_hex, stock), product_images(url, alt, position)";
