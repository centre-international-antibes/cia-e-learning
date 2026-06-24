import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CoachmarkProps {
  targetSelector: string;
  title: string;
  description: string;
  step: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isLast?: boolean;
}

export function Coachmark({
  targetSelector, title, description, step, total,
  onNext, onPrev, onSkip, isLast,
}: CoachmarkProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        setRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setRect(null);
      }
    };
    update();
    const t = setTimeout(update, 250);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [targetSelector]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrev, onSkip]);

  // Position bubble below or above target
  const bubblePos: React.CSSProperties = (() => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const padding = 16;
    const margin = 12;
    const bubbleW = Math.min(320, window.innerWidth - margin * 2);
    const below = rect.bottom + padding + 220 < window.innerHeight;
    const top = Math.max(margin, below ? rect.bottom + padding : rect.top - padding - 220);
    let left = rect.left + rect.width / 2 - bubbleW / 2;
    left = Math.max(margin, Math.min(window.innerWidth - bubbleW - margin, left));
    return { top, left, width: bubbleW };
  })();

  // Spotlight cutout via clipPath
  const spotlight = rect
    ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${rect.top - 8}px, ${rect.left - 8}px ${rect.top - 8}px, ${rect.left - 8}px ${rect.bottom + 8}px, ${rect.right + 8}px ${rect.bottom + 8}px, ${rect.right + 8}px ${rect.top - 8}px, 0 ${rect.top - 8}px)`
    : undefined;

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        style={spotlight ? { clipPath: spotlight } : undefined}
        onClick={onSkip}
      />
      {rect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute rounded-2xl ring-4 ring-primary/70 ring-offset-2 ring-offset-background/0"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={targetSelector}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute max-w-[calc(100vw-24px)] rounded-2xl bg-card border border-border shadow-2xl p-5"
          style={bubblePos}
        >
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-bold text-primary mb-1">{step} / {total}</p>
          <h3 className="font-display text-lg leading-tight pr-6">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
          <div className="flex items-center justify-between gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={onPrev} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Préc.
            </Button>
            <Button size="sm" className="btn-duo" onClick={onNext}>
              {isLast ? 'Terminer' : 'Suivant'}
              {!isLast && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}