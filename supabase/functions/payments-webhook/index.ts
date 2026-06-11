import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook, createStripeClient } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

function planFromStatus(status: string): string {
  return ["active", "trialing", "past_due"].includes(status) ? "premium" : "free";
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const row = {
    user_id: userId,
    plan: planFromStatus(subscription.status),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  // Manual upsert: the unique index on stripe_subscription_id is PARTIAL
  // (WHERE stripe_subscription_id IS NOT NULL), which PostgREST cannot use
  // as an ON CONFLICT target — so .upsert() fails. Do select-then-update
  // or insert ourselves and log any DB error so we never lose a payment.
  const sb = getSupabase();
  const { data: existing, error: selErr } = await sb
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (selErr) {
    console.error("[webhook] select existing failed", selErr);
  }

  if (existing?.id) {
    const { error } = await sb.from("subscriptions").update(row).eq("id", existing.id);
    if (error) console.error("[webhook] update subscription failed", error);
    else console.log("[webhook] subscription updated", subscription.id, "user", userId);
    return;
  }

  // No row tied to this stripe_subscription_id. Recycle the user's existing
  // free row (one per user from handle_new_user) when present, otherwise
  // insert a new row. This keeps the table tidy and avoids duplicates.
  const { data: freeRow } = await sb
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("environment", env)
    .is("stripe_subscription_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (freeRow?.id) {
    const { error } = await sb.from("subscriptions").update(row).eq("id", freeRow.id);
    if (error) console.error("[webhook] upgrade free row failed", error);
    else console.log("[webhook] free row upgraded to premium", subscription.id, "user", userId);
    return;
  }

  const { error } = await sb.from("subscriptions").insert(row);
  if (error) console.error("[webhook] insert subscription failed", error);
  else console.log("[webhook] subscription inserted", subscription.id, "user", userId);
}

async function markCanceled(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      plan: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // Fallback path: some Stripe configurations send checkout.session.completed
  // before/instead of customer.subscription.created. Retrieve the subscription
  // and upsert it ourselves so the local row exists immediately.
  const subscriptionId = session.subscription;
  if (!subscriptionId || typeof subscriptionId !== "string") {
    console.log("checkout.session.completed without subscription id, ignoring");
    return;
  }
  const stripe = createStripeClient(env);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
  // Backfill userId from the session metadata if it's missing on the subscription.
  if (!subscription.metadata?.userId && session.metadata?.userId) {
    (subscription as any).metadata = { ...subscription.metadata, userId: session.metadata.userId };
    try {
      await stripe.subscriptions.update(subscriptionId, {
        metadata: { ...subscription.metadata, userId: session.metadata.userId },
      });
    } catch (e) { console.warn("Failed to backfill subscription metadata", e); }
  }
  await upsertSubscription(subscription, env);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;
  try {
    const event = await verifyWebhook(req, env);
    console.log("[payments-webhook] env=", env, "type=", event.type, "id=", (event.data?.object as any)?.id);
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await markCanceled(event.data.object, env);
        break;
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});