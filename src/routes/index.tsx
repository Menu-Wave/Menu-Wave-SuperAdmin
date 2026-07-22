import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase, isPlatformAdmin, type PlatformOverviewRow, type PlatformSummary } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Menu-Wave — Super Admin" }] }),
  component: SuperAdminPage,
});

function SuperAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [restaurants, setRestaurants] = useState<PlatformOverviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const checkAuth = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setAuthorized(false);
      return;
    }
    const ok = await isPlatformAdmin();
    setAuthorized(ok);
    if (!ok) {
      setLoginError("This account doesn't have platform admin access.");
      await supabase.auth.signOut();
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadData = useCallback(async () => {
    const [summaryRes, overviewRes] = await Promise.all([
      supabase.from("v_platform_summary").select("*").single(),
      supabase.from("v_platform_overview").select("*").order("name"),
    ]);
    if (summaryRes.error) setError(summaryRes.error.message);
    setSummary((summaryRes.data as PlatformSummary) ?? null);
    setRestaurants((overviewRes.data as PlatformOverviewRow[]) ?? []);
  }, []);

  useEffect(() => {
    if (authorized) loadData();
  }, [authorized, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoggingIn(false);
    if (error) {
      setLoginError(error.message);
      return;
    }
    await checkAuth();
  };

  const toggleActive = async (r: PlatformOverviewRow) => {
    setSavingId(r.restaurant_id);
    setRestaurants((prev) =>
      prev.map((x) => (x.restaurant_id === r.restaurant_id ? { ...x, is_active: !x.is_active } : x)),
    );
    const { error } = await supabase
      .from("restaurants")
      .update({ is_active: !r.is_active })
      .eq("id", r.restaurant_id);
    setSavingId(null);
    if (error) {
      setError(error.message);
      loadData();
    }
  };

  const changeTier = async (r: PlatformOverviewRow, tier: string) => {
    setSavingId(r.restaurant_id);
    setRestaurants((prev) =>
      prev.map((x) => (x.restaurant_id === r.restaurant_id ? { ...x, tier: tier as PlatformOverviewRow["tier"] } : x)),
    );
    const { error } = await supabase.from("restaurants").update({ tier }).eq("id", r.restaurant_id);
    setSavingId(null);
    if (error) {
      setError(error.message);
      loadData();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthorized(false);
  };

  if (authorized === null) {
    return <div className="grid h-screen place-items-center text-slate-400">Loading…</div>;
  }

  if (!authorized) {
    return (
      <div className="grid h-screen place-items-center bg-slate-950 px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="mb-1 text-xl font-bold text-white">Menu-Wave</h1>
          <p className="mb-6 text-sm text-slate-400">Super admin access only</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            required
          />
          {loginError && <p className="mb-3 rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-lg bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loggingIn ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">Menu-Wave Platform</h1>
          <p className="text-xs text-slate-400">Super admin — cross-restaurant oversight</p>
        </div>
        <button onClick={logout} className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold">
          Log out
        </button>
      </header>

      {error && <div className="mx-6 mt-4 rounded-lg bg-red-950 px-4 py-2 text-sm text-red-300">{error}</div>}

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {summary && (
            <>
              <SummaryCard label="Total" value={summary.total_restaurants} />
              <SummaryCard label="Active" value={summary.active_restaurants} accent="text-green-400" />
              <SummaryCard label="Inactive" value={summary.inactive_restaurants} accent="text-red-400" />
              <SummaryCard label="Tier 1" value={summary.tier1_count} />
              <SummaryCard label="Tier 2 / 3" value={summary.tier2_count + summary.tier3_count} />
            </>
          )}
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-base font-bold">Restaurants ({restaurants.length})</h2>
          <div className="space-y-3">
            {restaurants.map((r) => (
              <div
                key={r.restaurant_id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-slate-500">
                    /{r.slug} · ₦{Number(r.total_revenue).toLocaleString()} · {r.paid_order_count} paid orders
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={r.tier}
                    onChange={(e) => changeTier(r, e.target.value)}
                    disabled={savingId === r.restaurant_id}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                  >
                    <option value="tier1">Tier 1</option>
                    <option value="tier2">Tier 2</option>
                    <option value="tier3">Tier 3</option>
                  </select>
                  <button
                    onClick={() => toggleActive(r)}
                    disabled={savingId === r.restaurant_id}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      r.is_active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                    }`}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            ))}
            {restaurants.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No restaurants yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ?? "text-white"}`}>{value}</p>
    </div>
  );
}
