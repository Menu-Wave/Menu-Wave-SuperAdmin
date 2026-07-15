import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { MenuPanel } from "./MenuPanel";
import { DropZone, ITEM_SIZE } from "./DropZone";
import { CheckoutBar } from "./CheckoutBar";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@/lib/menu-data";
import { formatNaira } from "@/lib/menu-data";

export function MealBuilder() {
  const move = useCart((s) => s.move);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const entries = useCart((s) => s.entries);
  const [active, setActive] = useState<MenuItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const onStart = (e: DragStartEvent) => {
    const item = e.active.data.current?.item as MenuItem | undefined;
    if (item) setActive(item);
  };

  const onEnd = (e: DragEndEvent) => {
    setActive(null);
    if (typeof e.active.id !== "string" || !e.active.id.startsWith("tray-")) return;
    const uid = e.active.data.current?.uid as string | undefined;
    if (!uid) return;
    const entry = entries.find((x) => x.uid === uid);
    if (!entry) return;

    // Swipe-to-remove: fast, mostly-horizontal drag
    if (Math.abs(e.delta.x) > 110 && Math.abs(e.delta.y) < 60) {
      const idx = entries.findIndex((x) => x.uid === uid);
      remove(uid);
      toast(`${entry.item.name} removed`, {
        description: formatNaira(entry.item.price),
        action: { label: "Undo", onClick: () => restore(entry, idx) },
        duration: 4000,
      });
      return;
    }

    const overRect = e.over?.rect;
    const newX = entry.x + e.delta.x;
    const newY = entry.y + e.delta.y;
    if (overRect) {
      const maxX = overRect.width - ITEM_SIZE - 8;
      const maxY = overRect.height - ITEM_SIZE - 8;
      move(uid, Math.max(8, Math.min(newX, maxX)), Math.max(8, Math.min(newY, maxY)));
    } else {
      move(uid, newX, newY);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onStart}
      onDragEnd={onEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-xl text-primary-foreground shadow-md shadow-primary/30">
              🍗
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-extrabold leading-tight text-foreground sm:text-lg">
                My Kitchen 
              </h1>
              <p className="truncate text-xs text-muted-foreground">Tap items · arrange your tray</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 sm:px-4 sm:py-6">
          <div className="flex flex-col gap-3 lg:grid lg:h-[calc(100vh-220px)] lg:min-h-[560px] lg:grid-cols-[minmax(280px,30%)_1fr] lg:gap-4">
            {/* Tray first on mobile so users see where taps land */}
            <div className="order-1 h-[46vh] min-h-[300px] lg:order-2 lg:h-auto">
              <DropZone />
            </div>
            <div className="order-2 min-h-[320px] lg:order-1 lg:h-auto">
              <MenuPanel />
            </div>
          </div>
        </main>

        <CheckoutBar />
      </div>

      <DragOverlay dropAnimation={null}>
        {active && (
          <div className="grid h-[72px] w-[72px] cursor-grabbing place-items-center overflow-hidden rounded-2xl bg-white text-4xl shadow-2xl ring-1 ring-black/10">
            {active.image ? (
              <img src={active.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{active.emoji}</span>
            )}
            <span className="sr-only">
              {active.name} {formatNaira(active.price)}
            </span>
          </div>
        )}
      </DragOverlay>
      <Toaster position="bottom-center" richColors closeButton />
    </DndContext>
  );
}
