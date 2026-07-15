// Supabase Edge Function: checkout
// Deploy with: `supabase functions deploy checkout --no-verify-jwt`
// (or via the Supabase Dashboard → Edge Functions → New function → paste this file)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type CheckoutPayload = {
  name?: string;
  order?: OrderItem[];
  total?: number;
  table_number?: number;
  currency?: string;
  placedAt?: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function summarizeOrder(order: OrderItem[]): string {
  return order
    .map((i) => `${i.quantity}× ${i.name} @ ${i.unitPrice} = ${i.subtotal}`)
    .join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload: CheckoutPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { name, order, total, table_number } = payload;

  if (!name || typeof name !== "string" || !name.trim()) {
    return json(400, { error: "Missing required field: name" });
  }
  if (!order || !Array.isArray(order) || order.length === 0) {
    return json(400, { error: "Missing required field: order" });
  }
  if (total === undefined || total === null || typeof total !== "number") {
    return json(400, { error: "Missing required field: total" });
  }

  if (table_number !== undefined && table_number !== null) {
    if (
      !Number.isInteger(table_number) ||
      table_number < 1 ||
      table_number > 50
    ) {
      return json(400, {
        error: "table_number must be an integer between 1 and 50",
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      Name: name,
      Order: summarizeOrder(order),
      Amount: total,
      Status: "New",
      table_number: table_number ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert failed", error);
    return json(500, { error: error.message });
  }

  return json(200, data);
});
