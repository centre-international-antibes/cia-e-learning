import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Loader2, ExternalLink, Crown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PRICE_ID = "premium_monthly";
const PRICE_LABEL = "9,99 € / mois";

const BENEFITS = [
  "Accès complet aux niveaux A2 à C2",
  "Tous les modules et leçons du parcours",
  "Audio illimité (synthèse vocale premium)",
  "Suivi de progression détaillé",
  "Badge Premium sur votre profil",
  "Annulation possible à tout moment",
];

export default function Abonnement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscription, isPremium, loading, syncWithStripe, refetch } = useSubscription();
  const [showCheckout, setShowCheckout] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle return from Stripe checkout
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "1") {
      toast.success("Paiement validé ! Bienvenue dans Premium 🎉");
      // Webhook can lag a few seconds — poll a few times.
      void syncWithStripe();
      const t1 = setTimeout(() => { void syncWithStripe(); }, 2500);
      const t2 = setTimeout(() => { void syncWithStripe(); }, 6000);
      const t3 = setTimeout(() => { void syncWithStripe(); }, 12000);
      const next = new URLSearchParams(searchParams);
      next.delete("success");
      next.delete("session_id");
      setSearchParams(next, { replace: true });
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else if (canceled === "1") {
      toast.info("Paiement annulé. Vous pouvez réessayer quand vous voulez.");
      const next = new URLSearchParams(searchParams);
      next.delete("canceled");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, syncWithStripe]);

  useEffect(() => { void syncWithStripe(); }, [syncWithStripe]);

  const openPortal = async () => {
    if (!isPaymentsConfigured()) {
      toast.error("Les paiements ne sont pas encore configurés.");
      return;
    }
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/abonnement`,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || data?.error || "Erreur");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPortalLoading(false);
    }
  };

  if (!user) {
    navigate("/connexion?redirect=/abonnement", { replace: true });
    return null;
  }

  const returnUrl = `${window.location.origin}/abonnement?success=1&session_id={CHECKOUT_SESSION_ID}`;

  return (
    <>
      <PaymentTestModeBanner />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="container max-w-3xl py-8 pb-24 md:pb-12"
      >
        <header className="mb-6">
          <h1 className="font-display text-3xl mb-1 flex items-center gap-2">
            <Crown className="h-7 w-7 text-cia-gold-500" />
            Mon abonnement
          </h1>
          <p className="text-muted-foreground font-semibold">
            Gérez votre formule et accédez à l'ensemble du parcours CIA.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isPremium ? (
          <Card variant="elevated" tone="gold">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <Badge className="bg-cia-gold-500 text-white border-transparent mb-2">
                    <Sparkles className="h-3 w-3 mr-1" /> Premium actif
                  </Badge>
                  <CardTitle>Premium CIA</CardTitle>
                  <CardDescription>{PRICE_LABEL}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-semibold">
                    {subscription?.cancel_at_period_end ? "Se termine le" : "Prochaine échéance"}
                  </p>
                  <p className="text-sm font-bold">
                    {subscription?.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "long", year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription?.cancel_at_period_end && (
                <div className="flex items-start gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                  <p>
                    Votre abonnement est programmé pour s'arrêter. Vous gardez l'accès jusqu'à la date ci-dessus.
                  </p>
                </div>
              )}
              <ul className="space-y-2">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success-500 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button onClick={openPortal} disabled={portalLoading} variant="outline" className="w-full sm:w-auto">
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gérer mon abonnement
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Mise à jour du moyen de paiement, factures et annulation depuis l'espace sécurisé Stripe.
              </p>
            </CardContent>
          </Card>
        ) : showCheckout ? (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Finaliser votre abonnement</CardTitle>
              <CardDescription>Premium CIA — {PRICE_LABEL}</CardDescription>
            </CardHeader>
            <CardContent>
              {isPaymentsConfigured() ? (
                <StripeEmbeddedCheckout
                  priceId={PRICE_ID}
                  returnUrl={returnUrl}
                  onComplete={() => {
                    toast.success("Paiement validé ! Bienvenue dans Premium 🎉");
                    setShowCheckout(false);
                    void syncWithStripe();
                    setTimeout(() => { void syncWithStripe(); }, 2500);
                    setTimeout(() => { void syncWithStripe(); }, 6000);
                    setTimeout(() => { void syncWithStripe(); }, 12000);
                  }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Les paiements ne sont pas encore configurés.
                </div>
              )}
              <Button variant="ghost" className="mt-4" onClick={() => setShowCheckout(false)}>
                Retour
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated" tone="gold">
            <CardHeader>
              <Badge className="bg-cia-gold-500 text-white border-transparent w-fit mb-2">
                <Sparkles className="h-3 w-3 mr-1" /> Recommandé
              </Badge>
              <CardTitle className="text-3xl">Premium CIA</CardTitle>
              <CardDescription className="text-base">
                <span className="text-3xl font-bold text-foreground">9,99 €</span>
                <span className="text-muted-foreground"> / mois</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-2">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success-500 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button
                size="cta"
                className="w-full"
                onClick={() => setShowCheckout(true)}
                disabled={!isPaymentsConfigured()}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                S'abonner — 9,99 € / mois
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Paiement sécurisé. Annulation possible à tout moment depuis votre espace.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </>
  );
}