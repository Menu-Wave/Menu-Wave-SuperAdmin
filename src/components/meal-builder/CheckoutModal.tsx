import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { useCart, cartTotal } from "@/lib/cart-store";
import { formatNaira } from "@/lib/menu-data";

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const entries = useCart((s) => s.entries);
  const name = useCart((s) => s.name);
  const clear = useCart((s) => s.clear);
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = cartTotal(entries);

  // Group duplicates
  const grouped = entries.reduce<Record<number, { name: string; emoji: string; price: number; qty: number }>>(
    (acc, e) => {
      const k = e.item.id;
      if (!acc[k]) acc[k] = { name: e.item.name, emoji: e.item.emoji, price: e.item.price, qty: 0 };
      acc[k].qty += 1;
      return acc;
    },
    {},
  );

  const generateOrderNumber = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CR-${ts}-${rand}`;
  };

  const handlePlace = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const newOrderNumber = generateOrderNumber();
    const payload = {
      orderNumber: newOrderNumber,
      name,
      total,
      currency: "NGN",
      placedAt: new Date().toISOString(),
      items: Object.values(grouped).map((g) => ({
        name: g.name,
        emoji: g.emoji,
        price: g.price,
        quantity: g.qty,
        subtotal: g.price * g.qty,
      })),
    };
    try {
      const res = await fetch(
        "https://tenuous-serenity-unborn.ngrok-free.dev/webhook-test/c6725dd8-2f5f-497e-8612-0f0457b2342b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      setOrderNumber(newOrderNumber);
      setPlaced(true);
      setTimeout(() => {
        clear();
        setPlaced(false);
        setOrderNumber("");
        setSubmitting(false);
        onClose();
      }, 2600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send order");
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-10 w-10" strokeWidth={3} />
                </motion.div>
                <h3 className="mt-4 text-2xl font-extrabold text-foreground">Order Placed!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thank you, {name}. Your meal is on the way.
                </p>
                <p className="mt-3 rounded-lg bg-secondary px-3 py-1.5 text-xs font-mono font-semibold text-foreground">
                  Order #{orderNumber}
                </p>
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
                <div className="px-6 pb-6">
                  {error && (
                    <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={handlePlace}
                    disabled={submitting}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-extrabold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Placing…" : "Place Order"}
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
