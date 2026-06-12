import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
            style={pageTransition.style}
          >
            <Suspense fallback={<OutletFallback />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <GamificationOverlay />
      <OnboardingFlow />
    </div>
  );
}
