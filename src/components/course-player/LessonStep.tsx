import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Lightbulb } from 'lucide-react';
import type { LessonStep as LessonStepType } from '@/data/course-content';
import { StepCharacterBubble } from './StepCharacterBubble';
import { useDeclareAnswer } from './step-controller';

interface Props {
  step: LessonStepType;
}

export function LessonStep({ step }: Props) {
  // Étape libre : « Continuer » est actif d'emblée dans la CheckBar.
  useDeclareAnswer(true, () => ({ correct: true }));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <StepCharacterBubble characterId={step.characterId} message={step.characterMessage} />
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold font-display">{step.title}</h2>
      </div>

      <Card className="border-2">
        <CardContent className="p-6 prose prose-sm max-w-none">
          {step.content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return (
              <p
                key={i}
                className="my-1 text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatted }}
              />
            );
          })}
        </CardContent>
      </Card>

      {step.tip && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/20 border border-accent/30">
          <Lightbulb className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">{step.tip}</p>
        </div>
      )}
    </div>
  );
}
