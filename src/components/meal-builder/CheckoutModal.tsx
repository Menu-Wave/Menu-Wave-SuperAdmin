import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, X, Clock, ChefHat, Bell } from "lucide-react";
import { useCart, cartTotal } from "@/lib/cart-store";
import { formatNaira } from "@/lib/menu-data";
import { supabase } from "@/lib/supabase";

type OrderStage = "new" | "preparing" | "ready" | "done";

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const entries = useCart((s) => s.entries);
  const name = useCart((s) => s.name);
  const tableNumber = useCart((s) => s.tableNumber);
  const clear = useCart((s) => s.clear);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [status, setStatus] = useState<OrderStage>("new");
  const total = cartTotal(entries);
  const tableNum = Number(tableNumber);

  const grouped = entries.reduce<Record<number, { name: string; emoji: string; price: number; qty: number }>>(
    (acc, e) => {
      const k = e.item.id;
      if (!acc[k]) acc[k] = { name: e.item.name, emoji: e.item.emoji, price: e.item.price, qty: 0 };
      acc[k].qty += 1;
      return acc;
    },
    {},
  );

  // Subscribe to Realtime updates for this specific order once we have an id
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Republic_Data",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { Status?: string }).Status?.toLowerCase();
          if (newStatus === "preparing") setStatus("preparing");
          else if (newStatus === "ready") setStatus("ready");
          else if (newStatus === "done") setStatus("done");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const handlePlace = async () => {
    setError(null);
    if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 50) {
      setError("Please check your table number and try again. Valid table numbers are 1–50.");
      return;
    }
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const order = Object.values(grouped).map((g) => ({
      name: g.name,
      quantity: g.qty,
      unitPrice: g.price,
      subtotal: g.price * g.qty,
    }));

    try {
      const response = await fetch(
        "https://tenuous-serenity-unborn.ngrok-free.dev/webhook/611aee0b-8ccc-4a5f-82dd-edcd92914776",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber,
            name,
            table_number: tableNum,
            order,
            total,
            currency: "NGN",
            placedAt: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }

      const data = await response.json();
const orderRow = Array.isArray(data) ? data[0] : data;
if (orderRow?.id) {
  setOrderId(orderRow.id);
}

      setPlaced(true);
      setStatus("new");
    } catch (err) {
      console.error("Webhook failed", err);
      setError("Something went wrong placing your order. Please try again.");
    }
  };

  const handleCloseAfterDone = () => {
    clear();
    setPlaced(false);
    setOrderId(null);
    setStatus("new");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={placed ? undefined : onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
          >
            {placed ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                {status === "done" || status === "ready" ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Bell className="h-10 w-10" strokeWidth={2.5} />
                    </motion.div>
                    <h3 className="mt-4 text-2xl font-extrabold text-foreground">
                      Table {tableNum} · Your order is ready!
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Please proceed to the counter to collect your meal, {name}.
                    </p>
                    <button
                      onClick={handleCloseAfterDone}
                      className="mt-6 rounded-xl bg-primary px-6 py-2 text-sm font-bold text-primary-foreground"
                    >
                      Got it
                    </button>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: status === "preparing" ? 360 : 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-foreground"
                    >
                      {status === "preparing" ? (
                        <ChefHat className="h-10 w-10" />
                      ) : (
                        <Clock className="h-10 w-10" />
                      )}
                    </motion.div>
                    <h3 className="mt-4 text-2xl font-extrabold text-foreground">
                      Table {tableNum} · {status === "preparing" ? "Preparing your meal" : "Order received"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Thank you, {name}. {orderId ? `Order #${orderId}. ` : ""}
                      We'll notify you the moment it's ready — feel free to stay on this screen.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h3 className="text-lg font-bold text-foreground">Order Summary</h3>
                  <button
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[50vh] space-y-2 overflow-y-auto px-6 py-4">
                  {Object.values(grouped).map((g) => (
                    <div key={g.name} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                      <span className="text-2xl">{g.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNaira(g.price)} × {g.qty}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {formatNaira(g.price * g.qty)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-6 py-4">
                  <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                    <span>Customer</span>
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-2xl font-extrabold text-foreground">{formatNaira(total)}</span>
                  </div>
                </div>
                {error && (
                  <div className="mx-6 mb-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <div className="px-6 pb-6">
                  <button
                    onClick={handlePlace}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-extrabold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Place Order
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
