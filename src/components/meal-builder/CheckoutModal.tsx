import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, X, Clock, ChefHat, Bell } from "lucide-react";
import { useCart, cartTotal } from "@/lib/cart-store";
import { formatNaira } from "@/lib/menu-data";
import { supabase } from "@/lib/supabase";

const SUPABASE_ANON_KEY = "sb_publishable_yBQbpGGMjBRDqwkID4QfvA_9amBX3Xx";

type OrderStage = "new" | "preparing" | "ready" | "done";

async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && retries > 0) throw new Error(`status ${res.status}`);
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const entries = useCart((s) => s.entries);
  const name = useCart((s) => s.name);
  const tableNumber = useCart((s) => s.tableNumber);
  const clear = useCart((s) => s.clear);
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStage>("new");
  const [connected, setConnected] = useState(true);
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
      .subscribe((subStatus) => {
        setConnected(subStatus === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const handlePlace = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 50) {
      setError("Please check your table number and try again. Valid table numbers are 1–50.");
      setSubmitting(false);
      return;
    }

    const newOrderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const order = Object.values(grouped).map((g) => ({
      name: g.name,
      quantity: g.qty,
      unitPrice: g.price,
      subtotal: g.price * g.qty,
    }));

    try {
      const response = await fetchWithRetry(
        "https://jbhlflxfvefgubbjudaq.supabase.co/functions/v1/checkout-",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            orderNumber: newOrderNumber,
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
        throw new Error(`Checkout failed with status ${response.status}`);
      }

      const orderRow = await response.json();
      if (orderRow?.id) {
        setOrderId(orderRow.id);
      }
      setOrderNumber(orderRow?.orderNumber ?? orderRow?.order_number ?? newOrderNumber);

      setPlaced(true);
      setStatus("new");
    } catch (err) {
      console.error("Checkout failed", err);
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAfterDone = () => {
    clear();
    setPlaced(false);
    setOrderId(null);
    setOrderNumber(null);
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
                      Thank you, {name}. {orderNumber ? `Order ${orderNumber}. ` : ""}
                      We'll notify you the moment it's ready — feel free to stay on this screen.
                    </p>
                    {!connected && (
                      <p className="mt-2 text-xs text-amber-600">
                        Reconnecting... if this persists, check the counter directly.
                      </p>
                    )}
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
                    disabled={submitting}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-extrabold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
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
