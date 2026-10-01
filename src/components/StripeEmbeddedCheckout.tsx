import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  priceId: string;
  returnUrl: string;
  onComplete?: () => void;
}

export function StripeEmbeddedCheckout({ priceId, returnUrl, onComplete }: Props) {
  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { priceId, returnUrl, environment: getStripeEnvironment() },
        });
        if (error || !data?.clientSecret) {
          throw new Error(error?.message || data?.error || "Impossible de créer la session de paiement");
        }
        return data.clientSecret as string;
      },
      onComplete,
    }),
    [priceId, returnUrl, onComplete],
  );

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}