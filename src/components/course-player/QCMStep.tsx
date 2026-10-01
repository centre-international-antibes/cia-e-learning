import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import type { QCMStep as QCMStepType } from '@/data/course-content';
import { StepCharacterBubble } from './StepCharacterBubble';
import { StepOption } from './StepOption';
import { useDeclareAnswer, useOptionShortcut, useStepController } from './step-controller';

interface Props {
  step: QCMStepType;
  /** Sélection d'une option — remonte au player pour le retour sonore. */
  onSelect?: () => void;
}

export function QCMStep({ step, onSelect }: Props) {
  const { t } = useTranslation();
  const { phase } = useStepController();
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = phase === 'revealed';

  useDeclareAnswer(selected !== null, () => ({
    correct: selected === step.correctIndex,
    solution: step.options[step.correctIndex],
  }));

  useOptionShortcut((index) => {
    if (revealed || index >= step.options.length) return;
    setSelected(index);
    onSelect?.();
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepCharacterBubble characterId={step.characterId} message={step.characterMessage} />
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">{step.title}</h2>
      </div>

      <Card className="border-2">
        <CardContent className="p-6">
          <p className="mb-6 text-lg font-medium">{step.question}</p>
          <div className="grid gap-3" role="radiogroup" aria-label={step.question}>
            {step.options.map((opt, i) => (
              <StepOption
                key={i}
                label={opt}
                marker={String(i + 1)}
                selected={selected === i}
                revealed={revealed}
                isCorrect={i === step.correctIndex}
                onSelect={() => {
                  if (revealed) return;
                  setSelected(i);
                  onSelect?.();
                }}
              />
            ))}
          </div>
          {revealed && step.explanation && (
            <p className="mt-4 text-sm text-muted-foreground">{step.explanation}</p>
          )}
        </CardContent>
      </Card>
      <p className="sr-only">{t('player.checkHint')}</p>
    </div>
  );
}
