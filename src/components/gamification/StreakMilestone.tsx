import { useEffect, useState } from 'react';
import { motion, animate, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spark } from '@/components/spark/Spark';
import { StreakFlame } from './StreakFlame';
import { streakBurst } from '@/lib/confetti';
import { feedback } from '@/lib/feedback';

interface StreakMilestoneProps {
  streak: number;
  open: boolean;
  onClose: () => void;
}

const MILESTONES: Record<number, { titleKey: string; descKey: string }> = {
  7:   { titleKey: 'streak.m7.title',   descKey: 'streak.m7.desc' },
  14:  { titleKey: 'streak.m14.title',  descKey: 'streak.m14.desc' },
  30:  { titleKey: 'streak.m30.title',  descKey: 'streak.m30.desc' },
  100: { titleKey: 'streak.m100.title', descKey: 'streak.m100.desc' },
};

export function StreakMilestone({ streak, open, onClose }: StreakMilestoneProps) {
  const { t } = useTranslation();
  const meta = MILESTONES[streak];
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!open) return;

    setDisplayed(0);
    const controls = animate(0, streak, {
      duration: reduced ? 0.3 : 0.9,
      delay: reduced ? 0 : 0.3,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });

    const burstTimer = setTimeout(() => streakBurst(), reduced ? 0 : 200);

    if (!reduced) feedback.complete();

    return () => {
      controls.stop();
      clearTimeout(burstTimer);
    };
  }, [open, streak, reduced]);

  if (!meta) return null;

  const daysLabel = streak > 1
    ? t('streak.days_label_plural')
    : t('streak.days_label');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        overlayClassName="z-[200]"
        className="z-[201] max-w-md overflow-hidden border-0 bg-gradient-to-br from-streak-500 via-cia-red-500 to-streak-500 text-white p-0 [&>button]:hidden">
        <div className="relative px-8 py-10 text-center space-y-4 min-h-[460px] flex flex-col items-center justify-center">
          <motion.div
            className="absolute inset-0 -z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.4 } : { opacity: [0.3, 0.8, 0.4, 0.7] }}
            transition={reduced
              ? { duration: 0.3 }
              : { duration: 2.2, repeat: Infinity, repeatType: 'reverse' }
            }
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[radial-gradient(circle,_hsl(var(--cia-gold-500)/0.45)_0%,_transparent_60%)] blur-3xl" />
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 11, stiffness: 180, delay: 0.1 }}
            className="mx-auto h-28 w-28 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shadow-2xl"
          >
            <StreakFlame streak={streak} animateOnChange={false} sizeOverride={72} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="space-y-1"
          >
            <p className="text-7xl md:text-8xl font-display font-extrabold tabular-nums leading-none">
              {displayed}
            </p>
            <p className="text-sm uppercase tracking-widest font-semibold text-white/85">
              {daysLabel}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="space-y-1 max-w-sm"
          >
            <p className="text-xl font-display font-semibold">{t(meta.titleKey)}</p>
            <p className="text-sm text-white/85">{t(meta.descKey)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                type: 'spring',
                damping: 13,
                stiffness: 200,
                delay: 1.2,
              },
            }}
            className="pt-2"
          >
            <Spark mood="celebrating" size={72} embers />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.4 }}
            className="pt-3"
          >
            <Button
              onClick={onClose}
              variant="gold"
              size="cta"
              className="shadow-lg"
            >
              {t('streak.continue')}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
