## Diagnostic

Deux problèmes distincts, mais une même cause racine côté plomberie Stripe.

### 1. Boucle infinie après validation bancaire (3DS)

`supabase/functions/create-checkout/index.ts` crée la session avec `ui_mode: "embedded_page"`. Or le composant React `<EmbeddedCheckout>` (utilisé dans `src/components/StripeEmbeddedCheckout.tsx`) attend une session en `ui_mode: "embedded"`. En mode `embedded_page`, Stripe considère qu'il pilote toute la page : lors d'une authentification 3DS, la banque renvoie l'utilisateur sur `return_url`. La session a déjà été consommée, mais l'app rouvre une nouvelle session vierge → l'utilisateur ressaisit sa carte → boucle.

En `ui_mode: "embedded"` + `redirect_on_completion: "if_required"`, Stripe gère le 3DS **à l'intérieur de l'iframe** (pop-up bancaire) sans jamais sortir de l'app, sauf si la banque l'exige absolument.

### 2. Apple Pay : paiement OK mais l'app reste "non-abonné"

Vérification base : aucune ligne `subscriptions` ne contient de `stripe_subscription_id` (uniquement les lignes `free/sandbox` créées par `handle_new_user`). Donc ni le webhook `payments-webhook` ni la fonction `check-subscription` n'arrivent à écrire l'abonnement après paiement réel en live.

Causes probables, à corriger ensemble :

- **`useSubscription` ne réagit pas en temps réel.** Le toast `success=1` déclenche `syncWithStripe`, mais si `check-subscription` lève (ex. `customers.search` indisponible sur un compte Stripe live récent), l'erreur est avalée et la card "S'abonner" reste affichée.
- **Webhook live silencieux.** Les logs `payments-webhook` ne montrent que des boot/shutdown : soit l'événement `customer.subscription.created` n'arrive jamais (env query param incorrect dans l'URL de webhook live), soit il arrive mais `metadata.userId` est absent (cas du checkout where userId n'a pas été propagé sur la Subscription pour Apple Pay).
- **`handle_new_user` insère une ligne sans `environment` explicite** → défaut `'sandbox'`. En live, `useSubscription` filtre `environment = 'live'` et ne trouve rien, donc même si un upsert webhook fonctionne sur la ligne free pré-existante, on a deux univers parallèles.

## Plan d'action

### Étape 1 — Corriger l'`ui_mode` (résout la boucle 3DS)

**`supabase/functions/create-checkout/index.ts`**
- Remplacer `ui_mode: "embedded_page"` par `ui_mode: "embedded"`.
- Ajouter `redirect_on_completion: "if_required"` pour que Stripe ne quitte l'iframe que si la banque l'impose.
- Garder `return_url` (utilisé pour le fallback rare et pour la fin de session).

### Étape 2 — Détecter la fin de paiement sans dépendre du redirect

**`src/components/StripeEmbeddedCheckout.tsx`**
- Ajouter une prop `onComplete?: () => void`, passée à `EmbeddedCheckoutProvider` via l'option `onComplete`. Stripe l'appelle dès que le paiement est validé dans l'iframe (Apple Pay, carte sans 3DS, ou retour 3DS dans l'iframe).

**`src/pages/Abonnement.tsx`**
- Sur `onComplete` : fermer la card de checkout, afficher le toast "Paiement validé", déclencher immédiatement `syncWithStripe()` + polling (2s/6s/12s) en attendant le webhook.

### Étape 3 — Réactivité Supabase Realtime

**`src/hooks/useSubscription.ts`**
- Ajouter un canal `supabase.channel('user-subscription')` filtré sur `user_id=eq.<uid>` (table `subscriptions`).
- Sur événement INSERT/UPDATE, re-déclencher `refetch()` (qui ré-applique le filtre `environment`). Le passage `free → premium` devient instantané dès que le webhook upsert.

### Étape 4 — Webhook live fiable

**`supabase/functions/payments-webhook/index.ts`**
- Ajouter des logs explicites au début (`console.log("[payments-webhook] env=", rawEnv, " type=", event.type, " sub=", event.data.object?.id)`) pour pouvoir confirmer côté logs que les événements live arrivent.
- Dans `handleCheckoutCompleted`, déjà présent : backfill `metadata.userId` depuis la session. Bien — on garde, c'est la clé pour Apple Pay qui peut court-circuiter la séquence `subscription.created`.

**Vérification URL webhook live** : confirmer que l'URL enregistrée côté Stripe live se termine bien par `?env=live` (sinon le handler répond 200/ignored et rien ne s'écrit). Si l'URL est `?env=sandbox` ou sans paramètre, demander à l'utilisateur de re-déclencher la configuration via la fenêtre Lovable Payments.

### Étape 5 — Bouton "Gérer mon abonnement" (déjà câblé)

`create-portal-session` existe et est utilisé. À retester une fois qu'une vraie ligne `subscriptions` premium existe (les étapes 1-4 le permettront).

### Vérifications

1. **Boucle 3DS** : recommencer un paiement test avec une carte 3DS → l'authentification bancaire s'ouvre dans l'iframe Stripe, retour direct dans l'app, toast premium, card "Premium actif" affichée.
2. **Apple Pay** : payer via Apple Pay → `onComplete` ferme la card, premium activé en < 5s, badge présent, niveaux A2–C2 débloqués, bouton "Gérer mon abonnement" fonctionnel.
3. **Realtime** : confirmer dans la console qu'un événement realtime `UPDATE` arrive bien après le webhook.
4. **Vérif DB** : `SELECT plan, status, environment, current_period_end FROM subscriptions WHERE user_id = …` doit montrer `premium/active/live`.

## Fichiers modifiés

- `supabase/functions/create-checkout/index.ts` — `ui_mode: "embedded"` + `redirect_on_completion: "if_required"`
- `supabase/functions/payments-webhook/index.ts` — logs de diagnostic
- `src/components/StripeEmbeddedCheckout.tsx` — prop `onComplete`
- `src/pages/Abonnement.tsx` — handler `onComplete` → fermeture + sync
- `src/hooks/useSubscription.ts` — abonnement realtime sur `subscriptions`

Aucune migration de base, aucun changement de schéma.