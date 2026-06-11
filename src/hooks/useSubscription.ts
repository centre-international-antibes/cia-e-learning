import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

export type SubscriptionRow = {
  plan: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  price_id: string | null;
  environment: string;
};

function computeActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if (["active", "trialing", "past_due"].includes(row.status) && future) return true;
  if (row.status === "canceled" && end !== null && end > Date.now()) return true;
  return false;
}

export function useSubscription() {
  const { user } = useAuth();
  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const environment = isPaymentsConfigured() ? getStripeEnvironment() : "sandbox";

  const refetch = useCallback(async () => {
    if (!user) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, stripe_subscription_id, stripe_customer_id, current_period_end, cancel_at_period_end, price_id, environment")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRow((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [user, environment]);

  useEffect(() => { void refetch(); }, [refetch]);

  // Realtime: refetch as soon as Stripe webhook upserts the subscription row.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscription-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => { void refetch(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refetch]);

  // Try to sync with Stripe on first load so a freshly completed checkout
  // gets reflected even if the webhook is still in flight.
  const syncWithStripe = useCallback(async () => {
    if (!user || !isPaymentsConfigured()) return;
    try {
      await supabase.functions.invoke("check-subscription", {
        body: { environment },
      });
      await refetch();
    } catch (e) {
      console.warn("[useSubscription] sync failed", e);
    }
  }, [user, environment, refetch]);

  return {
    subscription: row,
    isActive: computeActive(row),
    isPremium: computeActive(row) && row?.plan === "premium",
    loading,
    refetch,
    syncWithStripe,
  };
}