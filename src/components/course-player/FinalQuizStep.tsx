import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Heart, XCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FinalQuizStep as FinalQuizStepType } from '@/data/course-content';
import { StepCharacterBubble } from './StepCharacterBubble';
import { StepOption } from './StepOption';
import { useDeclareAnswer, useOptionShortcut, useStepController } from './step-controller';

interface Props {
  step: FinalQuizStepType;
  /** Appelé quand le quiz est terminé — `passed` vaut pour toute l'étape. */
  onFinish: (passed: boolean) => void;
  onSelect?: () => void;
}

/**
 * Quiz final — plusieurs questions et trois vies dans une seule étape.
 *
 * Chaque question interne passe par la CheckBar comme n'importe quelle autre
 * question ; « Continuer » avance d'abord à l'intérieur du quiz, et ne rend la
 * main au player qu'une fois l'écran de résultat atteint.
 */
export function FinalQuizStep({ step, onFinish, onSelect }: Props) {
  const { t } = useTranslation();
  const { phase, setContinueHandler, resetPhase, setMode } = useStepController();
  const [qIndex, setQIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const currentQ = step.questions[qIndex];
  const revealed = phase === 'revealed';
  const passed = score >= Math.ceil(step.questions.length * 0.6);
  const outOfLives = lives <= 0;

  useDeclareAnswer(finished || selected !== null, () => {
    const correct = selected === currentQ.correctIndex;
    // Le décompte interne se fait au moment de la validation.
    if (correct) setScore((s) => s + 1);
    else setLives((l) => l - 1);
    return { correct, solution: currentQ.options[currentQ.correctIndex] };
  });

  useOptionShortcut((index) => {
    if (revealed || finished || index >= currentQ.options.length) return;
    setSelected(index);
    onSelect?.();
  });

  // Tant qu'il reste des questions, « Continuer » avance à l'intérieur du quiz ;
  // sur l'écran de résultat, il rend la main au player.
  useEffect(() => {
    if (finished || outOfLives) {
      setMode('continue');
      setContinueHandler(() => onFinish(passed));
      return () => setContinueHandler(null);
    }
    setMode('check');
    setContinueHandler(() => {
      const isLast = qIndex + 1 >= step.questions.length;
      if (isLast || lives <= 0) {
        setFinished(true);
        return;
      }
      setQIndex((i) => i + 1);
      setSelected(null);
      resetPhase();
    });
    return () => setContinueHandler(null);
  }, [
    finished,
    outOfLives,
    passed,
    onFinish,
    qIndex,
    lives,
    step.questions.length,
    setContinueHandler,
    resetPhase,
    setMode,
  ]);

  // Le mode forcé est rendu au player quand l'étape disparaît.
  useEffect(() => () => setMode(null), [setMode]);

  if (finished || outOfLives) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <div
          className={cn(
            'mx-auto flex h-24 w-24 items-center justify-center rounded-full',
            passed ? 'bg-success-500/15' : 'bg-cia-red-500/10',
          )}
        >
          {passed ? (
            <Trophy className="h-12 w-12 text-success-600" />
          ) : (
            <XCircle className="h-12 w-12 text-cia-red-500" />
          )}
        </div>
        <h2 className="font-display text-2xl font-bold">
          {passed ? t('player.congratulations') : t('player.courseNotPassed')}
        </h2>
        <p className="text-muted-foreground">
          {t('player.score')} : {score}/{step.questions.length}
          {passed ? ` — ${t('player.validated')}` : ` — ${t('player.keepPracticing')}`}
        </p>
        <div className="mx-auto max-w-xs">
          <Progress
            value={Math.round((score / Math.max(1, step.questions.length)) * 100)}
            className="h-3"
          />
        </div>
        <div className="flex justify-center gap-1">
          {Array.from({ length: step.questions.length }).map((_, i) => (
            <Star
              key={i}
              className={cn('h-6 w-6', i < score ? 'fill-accent text-accent' : 'text-muted')}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepCharacterBubble characterId={step.characterId} message={step.characterMessage} />
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <Trophy className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">
              {t('player.question')} {qIndex + 1}/{step.questions.length}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1"
          aria-label={t('player.livesLeft', { count: lives })}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                'h-5 w-5',
                i < lives ? 'fill-cia-red-500 text-cia-red-500' : 'text-muted',
              )}
            />
          ))}
        </div>
      </div>

      <Card className="border-2 border-accent/30">
        <CardContent className="p-6">
          <Progress value={(qIndex / step.questions.length) * 100} className="mb-4 h-1.5" />
          <p className="mb-6 text-lg font-medium">{currentQ.question}</p>
          <div className="grid gap-3" role="radiogroup" aria-label={currentQ.question}>
            {currentQ.options.map((opt, i) => (
              <StepOption
                key={`${qIndex}-${i}`}
                label={opt}
                marker={String(i + 1)}
                selected={selected === i}
                revealed={revealed}
                isCorrect={i === currentQ.correctIndex}
                onSelect={() => {
                  if (revealed) return;
                  setSelected(i);
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
