import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wxlhhisfexcltjpvcljo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6bs0IPax7ctABcDJrcWW5w_3PHfgfvk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  currency: string;
  table_count: number;
  order_code_prefix: string;
  is_active: boolean;
}

// Customers are anonymous — RLS does NOT auto-scope anon queries to a single
// restaurant the way it does for logged-in staff. Every query in this app
// must explicitly filter by the resolved restaurant_id.
export async function resolveRestaurant(slug: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, currency, table_count, order_code_prefix, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return data as Restaurant;
}

export const formatCurrency = (n: number, currency = "NGN") => {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };
  const symbol = symbols[currency] ?? currency + " ";
  return `${symbol}${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
