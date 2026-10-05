import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { fade, spring } from '@/lib/motion';
import { RewardEventBridge } from '@/features/rewards';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useInterfaceLanguage } from '@/hooks/useInterfaceLanguage';

/**
 * Écrans de l'app, par opposition au site vitrine : ils n'ont pas de pied de
 * page marketing. Le parcours et le défi sont des surfaces de jeu, pas des
 * pages à parcourir jusqu'en bas.
 */
const APP_ROUTES = ['/programme', '/dashboard', '/defi-du-jour', '/cours/', '/test-vitesse/'];
const isAppRoute = (pathname: string) => APP_ROUTES.some((r) => pathname.startsWith(r));

function OutletFallback() {
  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Chargement"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  // Sync interface language from DB on login
  useInterfaceLanguage();
  return (
    <div className="flex min-h-screen flex-col pl-safe pr-safe">
      <Header />
      <main className="flex-1 pb-safe min-h-[60vh]">
        {/*
         * Page transitions: we deliberately do NOT use `AnimatePresence
         * mode="wait"` here. Combined with `Suspense` + lazy routes, that
         * combo could wedge the layout — the exit of the previous route would
         * complete, but the new lazy chunk would suspend and the motion
         * wrapper could end up showing nothing until a hard refresh. Using a
         * plain `motion.div` keyed by pathname re-mounts on every navigation
         * with an enter animation only; `Suspense` always shows a visible
         * fallback while the next chunk loads.
         */}
        {/* Le footer vit **dans** la frontière de Suspense : pendant le
            chargement d'une route, il ne s'affiche pas sous le spinner. */}
        <Suspense fallback={<OutletFallback />}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              // Une fois la page posée, plus aucune transform inline : le
              // stacking context disparaît et les overlays (player, modales)
              // se superposent sans hack.
              transitionEnd: { transform: 'none' },
            }}
            exit={{ opacity: 0, transition: { duration: fade.fast } }}
            transition={{ ...spring.gentle, opacity: { duration: fade.base } }}
          >
            <Outlet />
          </motion.div>
          {!isAppRoute(location.pathname) && <Footer />}
        </Suspense>
      </main>
      {/* Convertit les anciens events window en entrées de la file du Director. */}
      <RewardEventBridge />
      <OnboardingFlow />
    </div>
  );
}
