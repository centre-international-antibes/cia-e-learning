## Cause

Les logs de l'edge function `create-checkout` montrent l'erreur Stripe :

> The `ui_mode` value `embedded` is no longer supported. Use `embedded_page` instead.

Lors du correctif précédent contre la boucle 3DS, j'avais changé `ui_mode: "embedded_page"` → `ui_mode: "embedded"`. Cette valeur n'existe pas dans l'API Stripe `2026-03-25.dahlia` utilisée ici — Stripe la rejette en 400, donc `clientSecret` n'est jamais retourné et le composant `EmbeddedCheckout` reste bloqué sur les skeletons gris.

## Correctif

Un seul fichier à modifier : `supabase/functions/create-checkout/index.ts`

- Remettre `ui_mode: "embedded_page"` (la seule valeur valide pour l'embedded checkout dans cette version de l'API).
- Garder `redirect_on_completion: "if_required"` et `return_url` — cette combinaison reste autorisée avec `embedded_page` et évite la redirection plein écran quand le paiement se termine dans l'iframe (Apple Pay, carte sans 3DS, ou 3DS validé dans le pop-up Stripe).

Aucune autre modification : `StripeEmbeddedCheckout.tsx`, `Abonnement.tsx`, `useSubscription.ts` et le webhook restent tels quels.

## Vérification

1. Recharger `/abonnement`, cliquer « S'abonner » → le formulaire Stripe se rend en moins de 2 s (plus de skeleton infini).
2. Logs `create-checkout` : plus d'erreur `ui_mode`, seulement les boots normaux.
3. Tester un paiement test → `onComplete` se déclenche, le toast s'affiche, le badge Premium apparaît via le webhook + Realtime.

## Note sur la boucle 3DS initiale

`embedded_page` est le seul mode embarqué supporté. Pour les cartes 3DS qui exigent une vraie redirection bancaire, Stripe gère désormais le retour via le `return_url` ; si l'utilisateur revoit le formulaire vide après retour banque, ce sera traité dans une itération suivante (probablement en gérant explicitement `session_id` côté client pour récupérer le statut sans relancer une session).
