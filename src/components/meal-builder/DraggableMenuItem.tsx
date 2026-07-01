import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { MenuItem } from "@/lib/menu-data";
import { formatNaira } from "@/lib/menu-data";

export function DraggableMenuItem({ item }: { item: MenuItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `menu-${item.id}`,
    data: { item },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group flex w-full cursor-grab items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition active:cursor-grabbing hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
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
      <span className="text-muted-foreground opacity-0 transition group-hover:opacity-100">⋮⋮</span>
    </button>
  );
}
