import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCart, cartTotal, type CartEntry } from "@/lib/cart-store";
import { formatNaira } from "@/lib/menu-data";

const MIN_ORDER = 3000;
const EXTRA_FEE = 400;
export const ITEM_SIZE = 76; // px

function TrayItem({ entry }: { entry: CartEntry }) {
  const remove = useCart((s) => s.remove);
  const entries = useCart((s) => s.entries);
  const restore = useCart((s) => s.restore);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tray-${entry.uid}`,
    data: { uid: entry.uid, kind: "tray" },
  });

  const handleRemove = async () => {
    const idx = entries.findIndex((e) => e.uid === entry.uid);
    remove(entry.uid);
    const { toast } = await import("sonner");
    toast(`${entry.item.name} removed`, {
      description: formatNaira(entry.item.price),
      action: {
        label: "Undo",
        onClick: () => restore(entry, idx),
      },
      duration: 4000,
    });
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
      animate={{
        scale: isDragging ? 1.18 : 1,
        opacity: 1,
        rotate: isDragging ? 4 : 0,
      }}
      exit={{ scale: 0.3, opacity: 0, rotate: 12 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      style={{
        position: "absolute",
        left: entry.x,
        top: entry.y,
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 1,
        touchAction: "none",
        filter: isDragging
          ? "drop-shadow(0 18px 24px rgba(0,0,0,0.35))"
          : "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
      }}
      className="group"
    >
      <button
        {...listeners}
        {...attributes}
        className={`relative grid h-full w-full touch-none place-items-center rounded-2xl text-4xl transition-shadow ${
          entry.item.image ? "bg-transparent" : "bg-white ring-1 ring-black/5"
        } ${
          isDragging
            ? "cursor-grabbing"
            : "cursor-grab"
        }`}
        aria-label={`${entry.item.name}, ${formatNaira(entry.item.price)}. Drag to reposition. Swipe left or right to remove.`}
      >
        {entry.item.image ? (
          <img
            src={entry.item.image}
            alt={entry.item.name}
            className="pointer-events-none h-full w-full select-none object-contain"
            draggable={false}
          />
        ) : (
          <span className="pointer-events-none select-none">{entry.item.emoji}</span>
        )}

        <span
          className={`pointer-events-none absolute -bottom-1.5 left-1/2 max-w-[100px] -translate-x-1/2 truncate rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white transition ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {entry.item.name}
        </span>
      </button>
      <button
        onClick={handleRemove}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -right-2 -top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-white text-destructive shadow-md ring-1 ring-black/10 transition hover:bg-destructive hover:text-white active:scale-90"
        aria-label={`Remove ${entry.item.name}`}
      >
        <X className="h-4 w-4" strokeWidth={3} />
      </button>
    </motion.div>
  );
}

export function DropZone() {
  const { isOver, setNodeRef } = useDroppable({ id: "meal-tray" });
  const entries = useCart((s) => s.entries);
  const move = useCart((s) => s.move);
  const total = cartTotal(entries);
  const remaining = Math.max(0, MIN_ORDER - total);
  const trayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = trayRef.current;
    if (!el) return;
    const clamp = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const maxX = Math.max(8, w - ITEM_SIZE - 8);
      const maxY = Math.max(8, h - ITEM_SIZE - 8);
      for (const e of entries) {
        const nx = Math.max(8, Math.min(e.x, maxX));
        const ny = Math.max(8, Math.min(e.y, maxY));
        if (nx !== e.x || ny !== e.y) move(e.uid, nx, ny);
      }
    };
    clamp();
    const ro = new ResizeObserver(clamp);
    ro.observe(el);
    return () => ro.disconnect();
  }, [entries, move]);

  const setRefs = (node: HTMLDivElement | null) => {
    trayRef.current = node;
    setNodeRef(node);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative flex-1 p-3">
        <motion.div
          ref={setRefs}
          animate={{ scale: isOver ? 1.01 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`relative h-full w-full overflow-hidden rounded-[42px] border-[10px] transition-colors ${
            isOver
              ? "border-amber-300 shadow-[0_0_0_10px_rgba(251,191,36,0.25),0_30px_60px_-20px_rgba(220,38,38,0.5)]"
              : "border-red-500 shadow-[0_20px_50px_-15px_rgba(220,38,38,0.45)]"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at 30% 25%, #ff6b6b 0%, #ef4444 45%, #dc2626 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[32px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 35%, rgba(0,0,0,0) 60%)",
            }}
          />
          <div className="pointer-events-none absolute inset-2 rounded-[30px] ring-1 ring-white/15" />

          <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-red-600 shadow">
            <ShoppingBag className="h-3.5 w-3.5" />
            {entries.length} item{entries.length === 1 ? "" : "s"}
          </div>

          {entries.length > 0 && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              Hold & drag to arrange · tap × or swipe to remove
            </div>
          )}

          {entries.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-white/95">
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-3 text-6xl drop-shadow-lg"
              >
                🍽️
              </motion.div>
              <p className="flex items-center gap-1.5 text-lg font-extrabold uppercase tracking-[0.18em] drop-shadow">
                <Sparkles className="h-4 w-4" /> Your tray
              </p>
              <p className="mt-1 text-sm font-medium text-white/85">
                Tap items on the menu to add them
              </p>
            </div>
          )}

          <AnimatePresence>
            {entries.map((e) => (
              <TrayItem key={e.uid} entry={e} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <motion.span
            key={total}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="text-2xl font-extrabold text-foreground"
          >
            {formatNaira(total)}
          </motion.span>
        </div>
        {remaining > 0 && entries.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Reach <span className="font-semibold text-foreground">{formatNaira(MIN_ORDER)}</span> to
            avoid extra fee of{" "}
            <span className="font-semibold text-destructive">{formatNaira(EXTRA_FEE)}</span>
            {" — "}
            <span className="text-primary">{formatNaira(remaining)} to go</span>
          </p>
        )}
      </div>
    </div>
  );
}
