import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { imageForName, type MenuItem } from "./menu-data";

export type Category = {
  id: number;
  name: string;
  display_order: number;
};

type Row = {
  id: number;
  name: string | null;
  price: number | string | null;
  category: string | null;
  emoji: string | null;
  image_url: string | null;
  is_available: boolean | null;
};

// Anon customers are NOT auto-scoped by RLS to a single restaurant the way
// logged-in staff are — every query here explicitly filters by restaurantId.

export function useCategories(restaurantId: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId == null) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, display_order")
        .eq("restaurant_id", restaurantId)
        .order("display_order");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setCategories((data ?? []) as Category[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return { categories, loading, error };
}

export function useMenuItems(restaurantId: number | null) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId == null) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, category, emoji, image_url, is_available")
        .eq("restaurant_id", restaurantId);
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as Row[];
      const mapped: MenuItem[] = rows
        .filter((r) => r.is_available !== false && r.name && r.category)
        .map((r) => ({
          id: Number(r.id),
          name: r.name as string,
          price: typeof r.price === "string" ? parseFloat(r.price) : Number(r.price ?? 0),
          category: r.category as string,
          emoji: r.emoji ?? "🍽️",
          image: imageForName(r.name as string) ?? r.image_url ?? undefined,
        }))
        .sort((a, b) => a.id - b.id);
      setItems(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return { items, loading, error };
}
