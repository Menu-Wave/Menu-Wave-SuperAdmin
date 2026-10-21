import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase, isPlatformAdmin, type PlatformOverviewRow, type PlatformSummary } from "@/lib/supabase";

type PlanDraft = { id: string; code: "starter" | "growth" | "pro"; name: string; description: string; monthlyPriceNaira: string; isActive: boolean; featuresJson: string; limitsJson: string; displayOrder: number };

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
  const [plans, setPlans] = useState<PlanDraft[]>([]);
  const [trialDays, setTrialDays] = useState("14");
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

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

  const loadBillingConfig = useCallback(async () => {
    const [plansRes, settingRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("display_order"),
      supabase.from("platform_settings").select("value").eq("key", "trial_duration_days").single(),
    ]);
    if (plansRes.error) setError(`Could not load plans: ${plansRes.error.message}`);
    if (settingRes.error) setError(`Could not load trial settings: ${settingRes.error.message}`);
    if (plansRes.data) {
      setPlans(plansRes.data.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description ?? "",
        monthlyPriceNaira: p.monthly_price_kobo == null ? "" : String(Number(p.monthly_price_kobo) / 100),
        isActive: Boolean(p.is_active),
        featuresJson: JSON.stringify(p.features ?? {}, null, 2),
        limitsJson: JSON.stringify(p.limits ?? {}, null, 2),
        displayOrder: Number(p.display_order ?? 0),
      })));
    }
    if (settingRes.data) setTrialDays(String(Number(settingRes.data.value)));
  }, []);

  useEffect(() => {
    if (authorized) loadBillingConfig();
  }, [authorized, loadBillingConfig]);

  const updatePlanDraft = (code: PlanDraft["code"], patch: Partial<PlanDraft>) => {
    setPlans((current) => current.map((p) => p.code === code ? { ...p, ...patch } : p));
  };

  const savePlan = async (plan: PlanDraft) => {
    setSavingBilling(true);
    setBillingMessage(null);
    try {
      const priceNaira = plan.monthlyPriceNaira.trim() === "" ? null : Number(plan.monthlyPriceNaira);
      if (priceNaira !== null && (!Number.isFinite(priceNaira) || priceNaira <= 0)) throw new Error("Enter a valid monthly price greater than zero, or leave it blank.");
      if (plan.isActive && priceNaira === null) throw new Error("Set a monthly price before publishing this plan.");
      const features = JSON.parse(plan.featuresJson || "{}");
      const limits = JSON.parse(plan.limitsJson || "{}");
      if (!features || Array.isArray(features) || typeof features !== "object") throw new Error("Features must be a JSON object.");
      if (!limits || Array.isArray(limits) || typeof limits !== "object") throw new Error("Limits must be a JSON object.");
      const { error } = await supabase.from("subscription_plans").update({
        name: plan.name.trim(), description: plan.description.trim(),
        monthly_price_kobo: priceNaira === null ? null : Math.round(priceNaira * 100),
        is_active: plan.isActive, features, limits, display_order: plan.displayOrder,
        updated_at: new Date().toISOString(),
      }).eq("id", plan.id);
      if (error) throw error;
      setBillingMessage(`${plan.name} saved successfully.`);
      await loadBillingConfig();
    } catch (e) {
      setBillingMessage(e instanceof Error ? e.message : "Could not save this plan.");
    } finally {
      setSavingBilling(false);
    }
  };

  const saveTrialDuration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBilling(true);
    setBillingMessage(null);
    const days = Number(trialDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setBillingMessage("Trial duration must be a whole number from 1 to 365 days.");
      setSavingBilling(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("platform_settings").update({
      value: days, updated_at: new Date().toISOString(), updated_by: user?.id ?? null,
    }).eq("key", "trial_duration_days");
    setSavingBilling(false);
    if (error) setBillingMessage(`Could not save trial duration: ${error.message}`);
    else setBillingMessage(`Default trial duration updated to ${days} days. This applies to new trials only.`);
  };

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

        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <h2 className="text-base font-bold">Billing configuration</h2>
            <p className="mt-1 text-sm text-slate-400">Changes here are stored in Supabase and used by onboarding. Existing trials keep their recorded end date.</p>
          </div>
          <form onSubmit={saveTrialDuration} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-300">Default trial duration (days)
              <input type="number" min="1" max="365" step="1" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" required />
            </label>
            <button type="submit" disabled={savingBilling} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save trial setting</button>
          </form>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{plan.code.toUpperCase()}</h3>
                  <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={plan.isActive} onChange={(e) => updatePlanDraft(plan.code, { isActive: e.target.checked })} /> Published</label>
                </div>
                <label className="block text-xs text-slate-400">Display name<input value={plan.name} onChange={(e) => updatePlanDraft(plan.code, { name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" required /></label>
                <label className="block text-xs text-slate-400">Monthly price (NGN)<input type="number" min="0.01" step="0.01" value={plan.monthlyPriceNaira} onChange={(e) => updatePlanDraft(plan.code, { monthlyPriceNaira: e.target.value })} placeholder="Leave blank to keep unpublished" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                <label className="block text-xs text-slate-400">Description<textarea value={plan.description} onChange={(e) => updatePlanDraft(plan.code, { description: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
                <label className="block text-xs text-slate-400">Features (JSON)<textarea value={plan.featuresJson} onChange={(e) => updatePlanDraft(plan.code, { featuresJson: e.target.value })} rows={5} spellCheck={false} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white" /></label>
                <label className="block text-xs text-slate-400">Limits (JSON)<textarea value={plan.limitsJson} onChange={(e) => updatePlanDraft(plan.code, { limitsJson: e.target.value })} rows={4} spellCheck={false} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white" /></label>
                <button type="button" onClick={() => savePlan(plan)} disabled={savingBilling} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Save {plan.code} plan</button>
              </div>
            ))}
          </div>
          {billingMessage && <p role="status" className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">{billingMessage}</p>}
          <p className="text-xs text-amber-300">Plan prices are saved in kobo for Paystack. Feature and limit JSON values are configuration only until backend enforcement is implemented in the next stage.</p>
        </section>

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
