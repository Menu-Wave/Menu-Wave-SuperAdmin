import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { categories, imageForName, type MenuItem } from "./menu-data";

type Row = {
  id: number;
  name: string | null;
  price: number | string | null;
  category: string | null;
  emoji: string | null;
  image_url: string | null;
  is_available: boolean | null;
};

const categoryOrder = new Map(categories.map((c, i) => [c, i] as const));

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, category, emoji, image_url, is_available");
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
        .sort((a, b) => {
          const ai = categoryOrder.get(a.category) ?? 999;
          const bi = categoryOrder.get(b.category) ?? 999;
          if (ai !== bi) return ai - bi;
          return a.id - b.id;
        });
      setItems(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}
