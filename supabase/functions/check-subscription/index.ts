import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { environment } = await req.json() as { environment: StripeEnv };
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    const stripe = createStripeClient(environment);

    // Find Stripe customer for this user via metadata.
    // customers.search can be unavailable on brand-new accounts (index not ready)
    // — fall back to list-by-email so the function never throws on undefined.
    let customerId: string | null = null;
    try {
      const customers = await stripe.customers.search({
        query: `metadata['userId']:'${user.id}'`,
        limit: 1,
      });
      if (customers?.data?.length) customerId = customers.data[0].id;
    } catch (searchErr) {
      console.warn("customers.search failed, falling back to list:", searchErr);
    }

    if (!customerId && user.email) {
      const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
      if (byEmail?.data?.length) customerId = byEmail.data[0].id;
    }

    if (!customerId) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    // Pick the most recent active-like subscription
    const subsData = subs?.data ?? [];
    const active = subsData
      .filter((s) => ["active", "trialing", "past_due"].includes(s.status))
      .sort((a, b) => b.created - a.created)[0]
      ?? subsData.sort((a, b) => b.created - a.created)[0];

    if (!active) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const item = (active as any).items?.data?.[0];
    const priceId = item?.price?.lookup_key
      || item?.price?.metadata?.lovable_external_id
      || item?.price?.id;
    const productId = item?.price?.product;
    const periodStart = item?.current_period_start ?? (active as any).current_period_start;
    const periodEnd = item?.current_period_end ?? (active as any).current_period_end;

    // Upsert into subscriptions table
    const plan = ["active", "trialing", "past_due"].includes(active.status) ? "premium" : "free";
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan,
        stripe_subscription_id: active.id,
        stripe_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status: active.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: (active as any).cancel_at_period_end ?? false,
        environment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

    return new Response(JSON.stringify({
      subscribed: ["active", "trialing", "past_due"].includes(active.status),
      status: active.status,
      price_id: priceId,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: (active as any).cancel_at_period_end ?? false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("check-subscription error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});