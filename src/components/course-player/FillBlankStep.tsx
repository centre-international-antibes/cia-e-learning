import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FillBlankStep as FillBlankStepType } from '@/data/course-content';
import { StepCharacterBubble } from './StepCharacterBubble';
import { StepOption } from './StepOption';
import { useDeclareAnswer, useOptionShortcut, useStepController } from './step-controller';

interface Props {
  step: FillBlankStepType;
  onSelect?: () => void;
}

export function FillBlankStep({ step, onSelect }: Props) {
  const { phase } = useStepController();
  const [selected, setSelected] = useState<string | null>(null);
  const revealed = phase === 'revealed';
  const isCorrect = selected === step.correctAnswer;

  useDeclareAnswer(selected !== null, () => ({
    correct: selected === step.correctAnswer,
    solution: step.correctAnswer,
  }));

  useOptionShortcut((index) => {
    if (revealed || index >= step.options.length) return;
    setSelected(step.options[index]);
    onSelect?.();
  });

  const parts = step.sentence.split('___');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepCharacterBubble characterId={step.characterId} message={step.characterMessage} />
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <PenLine className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">{step.title}</h2>
      </div>

      <Card className="border-2">
        <CardContent className="p-6">
          <p className="mb-6 text-lg font-medium leading-relaxed">
            {parts[0]}
            <span
              className={cn(
                'mx-1 inline-block min-w-[80px] rounded-lg border-2 border-dashed px-3 py-1 text-center font-bold',
                !selected && 'border-primary/50 text-muted-foreground',
                selected && !revealed && 'border-primary text-foreground',
                revealed && isCorrect && 'border-success-500 bg-success-500/10 text-success-700',
                revealed && !isCorrect && 'border-cia-red-500 bg-cia-red-500/10 text-cia-red-600',
              )}
            >
              {selected || '…'}
            </span>
            {parts[1]}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {step.options.map((opt, i) => (
              <StepOption
                key={opt}
                label={opt}
                marker={String(i + 1)}
                selected={selected === opt}
                revealed={revealed}
                isCorrect={opt === step.correctAnswer}
                onSelect={() => {
                  if (revealed) return;
                  setSelected(opt);
                  onSelect?.();
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
