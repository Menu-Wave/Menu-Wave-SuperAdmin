import { useState } from "react";
import { useCart, cartTotal } from "@/lib/cart-store";
import { CheckoutModal } from "./CheckoutModal";
import { formatCurrency, type Restaurant } from "@/lib/supabase";

export function validateTableNumber(raw: string, maxTables: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > maxTables) return null;
  return n;
}

export function CheckoutBar({ restaurant }: { restaurant: Restaurant }) {
  const name = useCart((s) => s.name);
  const setName = useCart((s) => s.setName);
  const tableNumber = useCart((s) => s.tableNumber);
  const setTableNumber = useCart((s) => s.setTableNumber);
  const entries = useCart((s) => s.entries);
  const [open, setOpen] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const total = cartTotal(entries);

  const validTable = validateTableNumber(tableNumber, restaurant.table_count);
  const tableFilled = tableNumber.trim().length > 0;
  const canCheckout = entries.length > 0 && name.trim().length > 0 && validTable !== null;
  const tableErrorMsg = `Please check your table number and try again. Valid table numbers are 1–${restaurant.table_count}.`;

  const handleCheckout = () => {
    if (validateTableNumber(tableNumber, restaurant.table_count) === null) {
      setTableError(tableErrorMsg);
      return;
    }
    setTableError(null);
    setOpen(true);
  };

  return (
    <>
      <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name Here"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            value={tableNumber}
            onChange={(e) => {
              setTableNumber(e.target.value);
              if (tableError) setTableError(null);
            }}
            inputMode="numeric"
            placeholder={`Table # (1–${restaurant.table_count})`}
            aria-invalid={tableFilled && validTable === null}
            aria-describedby="table-error"
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 sm:w-40 ${
              tableFilled && validTable === null
                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                : "border-border focus:border-primary focus:ring-primary/20"
            }`}
          />
          <button
            disabled={!canCheckout}
            onClick={handleCheckout}
            className="shrink-0 rounded-xl bg-primary px-8 py-3 text-sm font-extrabold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Checkout {entries.length > 0 && `· ${formatCurrency(total, restaurant.currency)}`}
          </button>
        </div>
        {tableError && (
          <p id="table-error" role="alert" className="mx-auto mt-2 max-w-7xl text-xs font-medium text-destructive">
            {tableError}
          </p>
        )}
      </div>
      <CheckoutModal open={open} onClose={() => setOpen(false)} restaurant={restaurant} />
    </>
  );
}
