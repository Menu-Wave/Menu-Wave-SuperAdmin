import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { type MenuItem } from "@/lib/menu-data";
import { useMenuItems, useCategories } from "@/lib/use-menu-items";
import { DraggableMenuItem } from "./DraggableMenuItem";

export function MenuPanel({ restaurantId, currency = "NGN" }: { restaurantId: number; currency?: string }) {
  const { items, loading, error } = useMenuItems(restaurantId);
  const { categories, loading: categoriesLoading } = useCategories(restaurantId);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const c of categories) map[c.name] = items.filter((m) => m.category === c.name);
    return map;
  }, [items, categories]);

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-bold text-foreground">Menu</h2>
        <p className="text-xs text-muted-foreground">Drag items to your tray →</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {(loading || categoriesLoading) && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Loading menu…</p>
        )}
        {error && (
          <p className="px-2 py-3 text-xs text-destructive">Failed to load menu: {error}</p>
        )}
        {!loading && !categoriesLoading && categories.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No menu categories yet — check back soon.
          </p>
        )}
        {categories.map((cat, idx) => {
          const isOpen = open[cat.name] ?? idx === 0;
          return (
            <div key={cat.id} className="overflow-hidden rounded-xl bg-secondary/50">
              <button
                onClick={() => setOpen((s) => ({ ...s, [cat.name]: !isOpen }))}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-foreground transition hover:bg-secondary"
              >
                <span className="text-lg">🍽️</span>
                <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{grouped[cat.name]?.length ?? 0}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="space-y-2 p-2">
                  {(grouped[cat.name] ?? []).map((item) => (
                    <DraggableMenuItem key={item.id} item={item} currency={currency} />
                  ))}
                  {(grouped[cat.name] ?? []).length === 0 && (
                    <p className="px-2 py-2 text-xs text-muted-foreground">No items in this category yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
