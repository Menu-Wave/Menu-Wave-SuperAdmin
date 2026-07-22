import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wxlhhisfexcltjpvcljo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6bs0IPax7ctABcDJrcWW5w_3PHfgfvk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "menu-wave-superadmin-auth",
  },
});

export interface PlatformOverviewRow {
  restaurant_id: number;
  name: string;
  slug: string;
  tier: "tier1" | "tier2" | "tier3";
  is_active: boolean;
  created_at: string;
  total_revenue: number;
  paid_order_count: number;
}

export interface PlatformSummary {
  total_restaurants: number;
  active_restaurants: number;
  inactive_restaurants: number;
  tier1_count: number;
  tier2_count: number;
  tier3_count: number;
}

// Confirms the logged-in user is genuinely a platform_admin.
// Returns false for any other role — this app has exactly one authorized role.
export async function isPlatformAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("staff")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || !data) return false;
  return data.role === "platform_admin";
}
