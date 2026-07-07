import { Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@/lib/menu-data";
import { formatNaira } from "@/lib/menu-data";

export function DraggableMenuItem({ item }: { item: MenuItem }) {
  const add = useCart((s) => s.add);
  const entries = useCart((s) => s.entries);

  const handleAdd = () => {
    // Auto-place inside the tray. MealBuilder clamps to tray bounds after mount via ResizeObserver.
    const index = entries.length;
    const col = index % 4;
    const row = Math.floor(index / 4) % 4;
    const x = 16 + col * 84 + (row % 2) * 20;
    const y = 16 + row * 84;
    add(item, x, y);
  };

  return (
    <button
      onClick={handleAdd}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition active:scale-[0.98] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-2xl">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          item.emoji
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{item.name}</span>
        <span className="block text-xs font-medium text-primary">{formatNaira(item.price)}</span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition group-hover:scale-110">
        <Plus className="h-4 w-4" strokeWidth={3} />
      </span>
    </button>
  );
}
