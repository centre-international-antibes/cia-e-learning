import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { pageTransition } from '@/lib/animations';
import { GamificationOverlay } from '@/components/gamification/GamificationOverlay';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useInterfaceLanguage } from '@/hooks/useInterfaceLanguage';

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
        <Suspense fallback={<OutletFallback />}>
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            transition={pageTransition.transition}
            style={pageTransition.style}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <Footer />
      <GamificationOverlay />
      <OnboardingFlow />
    </div>
  );
}
