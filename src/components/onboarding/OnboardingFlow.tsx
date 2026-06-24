import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Map, Users, GraduationCap, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useUserProgress } from '@/hooks/useUserProgress';
import { CoachmarkTour } from './CoachmarkTour';
import type { CECRLevel } from '@/data/demo-courses';

type Phase = 'welcome' | 'profile' | 'level' | 'tour';
type Profile = 'beginner' | 'falseBeginner' | 'confirmed';

export function OnboardingFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { needsOnboarding, markDone, skipForNow, loading } = useOnboarding();
  const { setLevel } = useUserProgress();
  const [phase, setPhase] = useState<Phase>('welcome');
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const disableAutoOpenInPreview = import.meta.env.DEV;

  // Auto-open when needed (and not on /test-niveau page)
  useEffect(() => {
    if (loading) return;
    const forceWelcome = new URLSearchParams(location.search).get('welcome') === '1';
    const onTestPage = location.pathname === '/test-niveau';
    if (forceWelcome && !onTestPage) {
      setOpen(true);
    } else if (disableAutoOpenInPreview || onTestPage || !needsOnboarding) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [disableAutoOpenInPreview, needsOnboarding, loading, location.pathname, location.search]);

  const close = async (markCompleted = true) => {
    setOpen(false);
    if (markCompleted) await markDone();
    if (new URLSearchParams(location.search).get('welcome')) {
      navigate(location.pathname, { replace: true });
    }
  };

  const handleSkip = () => {
    skipForNow();
    setOpen(false);
    if (new URLSearchParams(location.search).get('welcome')) {
      navigate(location.pathname, { replace: true });
    }
  };

  if (!open) return null;

  if (phase === 'tour') {
    return <CoachmarkTour onDone={() => close(true)} />;
  }

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="relative w-[calc(100vw-1.5rem)] max-w-md bg-card border border-border rounded-3xl shadow-2xl p-5 md:p-8"
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          {phase === 'welcome' && (
            <div className="text-center space-y-5">
              <div className="text-6xl animate-bounce-in">👋</div>
              <h2 className="font-display text-2xl md:text-3xl">{t('onboarding.welcome.title')}</h2>
              <p className="text-muted-foreground">{t('onboarding.welcome.subtitle')}</p>
              <Button size="lg" className="btn-duo w-full gap-2" onClick={() => setPhase('profile')}>
                {t('onboarding.welcome.cta')} <ArrowRight className="h-4 w-4" />
              </Button>
              <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
                {t('onboarding.skip')}
              </button>
            </div>
          )}

          {phase === 'profile' && (
            <div className="space-y-5">
              <h2 className="font-display text-xl md:text-2xl text-center pr-6">{t('onboarding.profile.title')}</h2>
              <div className="space-y-3">
                {(['beginner', 'falseBeginner', 'confirmed'] as Profile[]).map((p) => {
                  const Icon = p === 'beginner' ? Sparkles : p === 'falseBeginner' ? Users : GraduationCap;
                  const selected = profile === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setProfile(p)}
                      className={`w-full text-left p-3 md:p-4 rounded-2xl border-2 transition-all ${
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 p-2 rounded-xl ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm md:text-base break-words">{t(`onboarding.profile.${p}.label`)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">{t(`onboarding.profile.${p}.desc`)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button
                size="lg"
                className="btn-duo w-full gap-2"
                disabled={!profile}
                onClick={() => setPhase('level')}
              >
                {t('onboarding.next')} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {phase === 'level' && (
            <div className="space-y-5">
              <h2 className="font-display text-xl md:text-2xl text-center pr-6">{t('onboarding.level.title')}</h2>
              <p className="text-sm text-muted-foreground text-center">{t('onboarding.level.subtitle')}</p>

              <Button
                size="lg"
                className="btn-duo w-full gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  setOpen(false);
                  await markDone();
                  navigate('/test-niveau');
                }}
              >
                <Map className="h-4 w-4" /> {t('onboarding.level.takeTest')}
              </Button>

              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                  {t('onboarding.level.knowMine')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CECRLevel[]).map((lvl) => (
                    <Button
                      key={lvl}
                      variant="outline"
                      className="h-11 md:h-12 font-display text-base md:text-lg"
                      onClick={async () => {
                        await setLevel(lvl);
                        setPhase('tour');
                      }}
                    >
                      {lvl}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setPhase('tour')}
              >
                {t('onboarding.level.later')}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}