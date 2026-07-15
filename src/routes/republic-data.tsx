import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type RepublicDataRow } from "@/lib/supabase";

export const Route = createFileRoute("/republic-data")({
  head: () => ({
    meta: [{ title: "Staff Dashboard · Kitchen Orders" }],
  }),
  component: RepublicDataPage,
});

const STATUS_FLOW = ["new", "preparing", "ready", "done"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-amber-100 text-amber-800 border-amber-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  done: "bg-neutral-200 text-neutral-700 border-neutral-300",
};

function normalizeStatus(s: string | null | undefined): Status {
  const v = (s ?? "new").toLowerCase().trim();
  return (STATUS_FLOW as readonly string[]).includes(v) ? (v as Status) : "new";
}

function nextStatus(current: Status): Status | null {
  const i = STATUS_FLOW.indexOf(current);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}

function RepublicDataPage() {
  const [rows, setRows] = useState<RepublicDataRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) setError(error.message);
        else setRows((data ?? []) as RepublicDataRow[]);
      });

    const channel = supabase
      .channel("kitchen-data-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          setRows((prev) => {
            const list = prev ?? [];
            if (payload.eventType === "INSERT") {
              const row = payload.new as RepublicDataRow;
              if (list.some((r) => r.id === row.id)) return list;
              return [row, ...list];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as RepublicDataRow;
              return list.map((r) => (r.id === row.id ? row : r));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as RepublicDataRow;
              return list.filter((r) => r.id !== row.id);
            }
            return list;
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(row: RepublicDataRow, status: Status) {
    setUpdatingId(row.id);
    const prev = rows;
    setRows((r) => (r ?? []).map((x) => (x.id === row.id ? { ...x, Status: status } : x)));
    const { error } = await supabase
      .from("Republic_Data")
      .update({ Status: status })
      .eq("id", row.id);
    if (error) {
      setError(error.message);
      setRows(prev);
    }
    setUpdatingId(null);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Staff Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live orders · updates appear in real time
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Realtime
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          Error: {error}
        </div>
      )}
      {!rows && !error && <p className="text-muted-foreground">Loading…</p>}
      {rows && rows.length === 0 && (
        <p className="text-muted-foreground">No orders yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {rows?.map((r) => {
          const status = normalizeStatus(r.Status);
          const next = nextStatus(status);
          const busy = updatingId === r.id;
          return (
            <div
              key={String(r.id)}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {r.Name || "Unnamed"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
                >
                  {status}
                </span>
              </div>

              <div className="mb-3 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                {r.Order || "—"}
              </div>

              <div className="mb-4 text-sm font-semibold text-foreground">
                Amount: <span className="tabular-nums">{r.Amount ?? "—"}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {next && (
                  <button
                    onClick={() => updateStatus(r, next)}
                    disabled={busy}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "…" : `Mark ${next}`}
                  </button>
                )}
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(r, s)}
                    disabled={busy || s === status}
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground capitalize transition hover:bg-muted disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
