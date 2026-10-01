import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crown, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spark } from '@/components/spark/Spark';
import { springPop } from '@/lib/animations';
import { levelUpSequence } from '@/lib/confetti';
import { feedback } from '@/lib/feedback';

interface LevelUpCelebrationProps {
  /** Niveau atteint (A2, B1, B2, C1, C2) */
  level: string;
  /** Niveau précédent — si fourni, animation de "déchirement" affichée */
  previousLevel?: string;
  open: boolean;
  onClose: () => void;
}

const LEVEL_DESCRIPTIONS: Record<string, { titleKey: string; descKey: string }> = {
  A2: { titleKey: 'levelup.a2.title', descKey: 'levelup.a2.desc' },
  B1: { titleKey: 'levelup.b1.title', descKey: 'levelup.b1.desc' },
  B2: { titleKey: 'levelup.b2.title', descKey: 'levelup.b2.desc' },
  C1: { titleKey: 'levelup.c1.title', descKey: 'levelup.c1.desc' },
  C2: { titleKey: 'levelup.c2.title', descKey: 'levelup.c2.desc' },
};

type Phase = 'previous' | 'transition' | 'reveal';

export function LevelUpCelebration({
  level,
  previousLevel,
  open,
  onClose,
}: LevelUpCelebrationProps) {
  const { t } = useTranslation();
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const meta = LEVEL_DESCRIPTIONS[level] ?? {
    titleKey: 'levelup.generic.title',
    descKey: 'levelup.generic.desc',
  };

  const [phase, setPhase] = useState<Phase>(previousLevel ? 'previous' : 'reveal');

  useEffect(() => {
    if (!open) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (previousLevel && !reduced) {
      setPhase('previous');
      timers.push(setTimeout(() => setPhase('transition'), 800));
      timers.push(setTimeout(() => setPhase('reveal'), 1400));
      timers.push(setTimeout(() => levelUpSequence(), 1500));
    } else {
      setPhase('reveal');
      timers.push(setTimeout(() => levelUpSequence(), 100));
    }

    feedback.levelUp();

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [open, previousLevel, reduced]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden border-0 bg-gradient-to-br from-cia-blue-900 via-cia-blue-700 to-cia-blue-900 text-white p-0 [&>button]:hidden">
        <motion.div
          className="absolute inset-0 -z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={phase === 'reveal' ? { opacity: [0, 1, 0.7, 1] } : { opacity: 0 }}
          transition={phase === 'reveal'
            ? { duration: 2, repeat: Infinity, repeatType: 'reverse' }
            : { duration: 0.3 }
          }
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle,_hsl(var(--cia-gold-400)/0.35)_0%,_transparent_60%)] blur-3xl" />
        </motion.div>

        <div className="relative z-10 px-8 py-10 text-center space-y-4 min-h-[460px] flex flex-col items-center justify-center">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="uppercase tracking-widest text-xs font-semibold text-cia-gold-300"
          >
            {t('levelup.banner')}
          </motion.p>

          <div className="relative h-32 w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === 'previous' && previousLevel && (
                <motion.div
                  key="previous"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.4 } }}
                  className="absolute font-display font-extrabold text-6xl text-white/40"
                >
                  <motion.span
                    animate={{ x: [0, -3, 3, -3, 0], y: [0, 2, -2, 2, 0] }}
                    transition={{ duration: 0.3, repeat: 2, delay: 0.3 }}
                    style={{ display: 'inline-block' }}
                  >
                    {previousLevel}
                  </motion.span>
                </motion.div>
              )}

              {phase === 'transition' && (
                <motion.div
                  key="transition"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.3 }}
                  className="absolute"
                >
                  <Sparkles className="h-20 w-20 text-cia-gold-400 drop-shadow-[0_0_30px_rgba(204,174,98,0.8)]" />
                </motion.div>
              )}

              {phase === 'reveal' && (
                <motion.h2
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.3, rotateY: -90 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotateY: 0,
                    transition: {
                      type: 'spring',
                      damping: 10,
                      stiffness: 180,
                      mass: 0.9,
                    },
                  }}
                  className="absolute text-8xl md:text-9xl font-display font-extrabold bg-gradient-to-br from-cia-gold-300 via-cia-gold-400 to-cia-gold-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(204,174,98,0.6)]"
                  style={{
                    transformPerspective: 1200,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {level}
                </motion.h2>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                key="crown"
                variants={springPop}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ delay: 0.3 }}
                className="absolute top-12 left-1/2 -translate-x-1/2"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cia-gold-300 to-cia-gold-500 flex items-center justify-center shadow-[0_0_24px_rgba(204,174,98,0.7)]">
                  <Crown className="h-7 w-7 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                key="texts"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="space-y-1 max-w-sm"
              >
                <p className="text-xl font-display font-semibold">{t(meta.titleKey)}</p>
                <p className="text-sm text-white/80">{t(meta.descKey)}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                key="mascot"
                initial={{ opacity: 0, scale: 0, y: 40 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    damping: 13,
                    stiffness: 200,
                    delay: 0.8,
                  },
                }}
                className="pt-2"
              >
                <Spark mood="celebrating" size={80} embers />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                key="cta"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.4 }}
                className="pt-4"
              >
                <Button
                  variant="gold"
                  size="cta"
                  onClick={onClose}
                  className="shadow-lg"
                >
                  {t('levelup.continue')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
