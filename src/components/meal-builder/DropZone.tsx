import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCart, cartTotal, type CartEntry } from "@/lib/cart-store";
import { formatNaira } from "@/lib/menu-data";

const MIN_ORDER = 3000;
const EXTRA_FEE = 400;
export const ITEM_SIZE = 72; // px

function TrayItem({ entry }: { entry: CartEntry }) {
  const remove = useCart((s) => s.remove);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tray-${entry.uid}`,
    data: { uid: entry.uid, kind: "tray" },
  });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
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
      }}
      className="group"
    >
      <button
        {...listeners}
        {...attributes}
        className="relative grid h-full w-full cursor-grab place-items-center rounded-2xl bg-white text-4xl shadow-[0_6px_14px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition active:cursor-grabbing hover:scale-105"
        title={`${entry.item.name} — ${formatNaira(entry.item.price)}`}
      >
        {entry.item.image ? (
          <img
            src={entry.item.image}
            alt={entry.item.name}
            className="pointer-events-none h-full w-full select-none rounded-2xl object-cover"
          />
        ) : (
          <span className="pointer-events-none select-none">{entry.item.emoji}</span>
        )}
        <span className="pointer-events-none absolute -bottom-1 left-1/2 max-w-[90px] -translate-x-1/2 truncate rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
          {entry.item.name}
        </span>
      </button>
      <button
        onClick={() => remove(entry.uid)}
        className="absolute -right-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-white text-destructive shadow ring-1 ring-black/10 opacity-0 transition group-hover:opacity-100 hover:bg-destructive hover:text-white"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
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

  // Clamp items into the tray whenever it resizes or new items are added.
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
      {/* Tray */}
      <div className="relative flex-1 p-3">
        <div
          ref={setRefs}
          className={`relative h-full w-full overflow-hidden rounded-[42px] border-[10px] transition-all ${
            isOver
              ? "border-red-400 shadow-[0_0_0_8px_rgba(239,68,68,0.18),0_30px_60px_-20px_rgba(220,38,38,0.5)]"
              : "border-red-500 shadow-[0_20px_50px_-15px_rgba(220,38,38,0.45)]"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at 30% 25%, #ff6b6b 0%, #ef4444 45%, #dc2626 100%)",
          }}
        >
          {/* glossy highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[32px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 35%, rgba(0,0,0,0) 60%)",
            }}
          />
          {/* inner rim */}
          <div className="pointer-events-none absolute inset-2 rounded-[30px] ring-1 ring-white/15" />

          {/* item counter */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-red-600 shadow">
            <ShoppingBag className="h-3.5 w-3.5" />
            {entries.length} item{entries.length === 1 ? "" : "s"}
          </div>

          {entries.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-white/90">
              <motion.div
                animate={isOver ? { scale: 1.15 } : { scale: 1 }}
                className="mb-3 text-5xl drop-shadow"
              >
                🍽️
              </motion.div>
              <p className="text-xl font-extrabold uppercase tracking-[0.2em] drop-shadow">
                Drop on the tray
              </p>
              <p className="mt-1 text-sm font-medium text-white/80">
                Drag items here · rearrange freely
              </p>
            </div>
          )}

          {/* items */}
          <AnimatePresence>
            {entries.map((e) => (
              <TrayItem key={e.uid} entry={e} />
            ))}
          </AnimatePresence>
        </div>
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
