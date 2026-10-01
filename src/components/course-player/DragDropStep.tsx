import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pressable } from '@/components/ui/pressable';
import type { DragDropStep as DragDropStepType } from '@/data/course-content';
import { StepCharacterBubble } from './StepCharacterBubble';
import { useDeclareAnswer, useStepController } from './step-controller';

interface Props {
  step: DragDropStepType;
  onSelect?: () => void;
}

export function DragDropStep({ step, onSelect }: Props) {
  const { t } = useTranslation();
  const { phase } = useStepController();
  const [available, setAvailable] = useState<string[]>(() =>
    [...step.items].sort(() => Math.random() - 0.5),
  );
  const [placed, setPlaced] = useState<string[]>([]);
  const revealed = phase === 'revealed';
  const isCorrect = JSON.stringify(placed) === JSON.stringify(step.correctOrder);

  // « Vérifier » ne s'active qu'une fois tous les mots placés.
  useDeclareAnswer(placed.length === step.correctOrder.length, () => ({
    correct: JSON.stringify(placed) === JSON.stringify(step.correctOrder),
    solution: step.correctOrder.join(' '),
  }));

  const handleAdd = (item: string) => {
    if (revealed) return;
    setPlaced([...placed, item]);
    setAvailable(available.filter((_, i) => i !== available.indexOf(item)));
    onSelect?.();
  };

  const handleRemove = (index: number) => {
    if (revealed) return;
    const item = placed[index];
    setAvailable([...available, item]);
    setPlaced(placed.filter((_, i) => i !== index));
    onSelect?.();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepCharacterBubble characterId={step.characterId} message={step.characterMessage} />
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <GripVertical className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">{step.title}</h2>
      </div>

      <Card className="border-2">
        <CardContent className="space-y-4 p-6">
          <p className="mb-2 text-muted-foreground">{step.instruction}</p>

          <div
            className={cn(
              'flex min-h-[56px] flex-wrap gap-2 rounded-xl border-2 border-dashed p-3',
              placed.length === 0 && 'items-center justify-center',
              revealed && isCorrect && 'border-success-500 bg-success-500/10',
              revealed && !isCorrect && 'border-cia-red-500 bg-cia-red-500/10',
            )}
          >
            {placed.length === 0 && (
              <span className="text-sm text-muted-foreground">{t('player.clickWordsBelow')}</span>
            )}
            {placed.map((item, i) => (
              <Pressable
                key={`${item}-${i}`}
                tone={revealed ? (isCorrect ? 'success' : 'danger') : 'primary'}
                depth="sm"
                scope="player"
                silent
                disabled={revealed}
                onClick={() => handleRemove(i)}
                className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-100"
              >
                {item}
              </Pressable>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {available.map((item, i) => (
              <Pressable
                key={`${item}-${i}`}
                tone="neutral"
                depth="sm"
                scope="player"
                silent
                disabled={revealed}
                onClick={() => handleAdd(item)}
                className={cn('rounded-lg px-3 py-1.5 text-sm', revealed && 'opacity-40')}
              >
                {item}
              </Pressable>
            ))}
          </div>

          {revealed && !isCorrect && (
            <p className="text-sm text-muted-foreground">
              {t('player.correctAnswer')} : {step.correctOrder.join(' ')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
