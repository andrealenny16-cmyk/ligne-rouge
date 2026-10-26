import { getSession } from "@/lib/supabase/server";
import HeaderNav from "./HeaderNav";

export default async function Header() {
  const { supabase, user, profile } = await getSession();
  let cartCount = 0;
  if (user) {
    const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
    cartCount = (data ?? []).reduce((n, i) => n + i.quantity, 0);
  }
  return <HeaderNav cartCount={cartCount} loggedIn={!!user} isAdmin={profile?.role === "admin"} />;
}
