import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FlashcardStep as FlashcardStepType } from '@/data/course-content';
import { StepCharacterBubble } from './StepCharacterBubble';
import { useDeclareAnswer } from './step-controller';

interface Props {
  step: FlashcardStepType;
}

export function FlashcardStep({ step }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(0);
  const card = step.cards[index];

  // « Continuer » n'est actif qu'une fois la dernière carte atteinte : on ne
  // passe pas un paquet de vocabulaire sans l'avoir parcouru.
  useDeclareAnswer(seen >= step.cards.length - 1, () => ({ correct: true }));

  const handleFlip = () => setFlipped(!flipped);
  const handlePrev = () => {
    setIndex(Math.max(0, index - 1));
    setFlipped(false);
  };
  const handleNext = () => {
    if (index < step.cards.length - 1) {
      const next = index + 1;
      setIndex(next);
      setSeen((s) => Math.max(s, next));
      setFlipped(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StepCharacterBubble characterId={step.characterId} message={step.characterMessage} />
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold font-display">{step.title}</h2>
        <span className="text-sm text-muted-foreground font-mono">
          {index + 1}/{step.cards.length}
        </span>
      </div>

      {/* Card */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className={cn(
            'relative w-full h-56 transition-transform duration-500',
            flipped && '[transform:rotateY(180deg)]',
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-cia-blue-200 bg-gradient-to-br from-cia-blue-50 to-card flex items-center justify-center p-8 text-center shadow-md"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div>
              <p className="text-2xl font-bold text-foreground">{card.front}</p>
              <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <RotateCcw className="h-3 w-3" /> {t('player.clickToFlip')}
              </p>
            </div>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-cia-gold-300 bg-gradient-to-br from-cia-gold-50 to-card flex items-center justify-center p-8 text-center [transform:rotateY(180deg)] shadow-md"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xl font-medium text-foreground">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handlePrev} disabled={index === 0} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('player.previous')}
        </Button>
        <Button
          variant="default"
          size="cta"
          onClick={handleNext}
          disabled={index >= step.cards.length - 1}
          className="flex-1"
        >
          {t('player.next')} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5">
        {step.cards.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              i === index ? 'bg-primary w-6' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}
