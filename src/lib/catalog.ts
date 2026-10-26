import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, type Product, type VehicleMake, type VehicleModel } from "@/lib/types";

export async function getVehicles() {
  const supabase = await createClient();
  const [{ data: makes }, { data: models }] = await Promise.all([
    supabase.from("vehicle_makes").select("id, name, type").order("name"),
    supabase.from("vehicle_models").select("id, make_id, name, generation, year_from, year_to, engine, power_hp").order("name"),
  ]);
  return { makes: (makes ?? []) as VehicleMake[], models: (models ?? []) as VehicleModel[] };
}

export async function getProducts() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).order("ref");
  return (data ?? []) as unknown as Product[];
}
