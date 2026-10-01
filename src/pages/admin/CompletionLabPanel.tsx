import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { CompletionScreen } from '@/components/course-player/CompletionScreen';
import type { LessonSubmitResult } from '@/components/course-player/lesson-result';
import { useRewards } from '@/features/rewards';

/**
 * Banc d'essai de l'écran de fin.
 *
 * On rejoue chaque réponse possible du serveur, avec la latence qu'on veut, et
 * on vérifie l'essentiel : la chorégraphie ne dépend pas de la réponse, la
 * tuile XP l'attend, et les célébrations enfilées pendant la soumission passent
 * **après** — par-dessus l'écran, jamais pendant.
 *
 * L'écran est monté dans un calque `z-[100]`, exactement comme le portal du
 * player : c'est la seule façon de voir si une célébration lui passe dessus.
 */

type ScenarioKey = 'perfect' | 'normal' | 'too_fast' | 'replay_cap' | 'offline';

interface Scenario {
  label: string;
  correctCount: number;
  totalQuestions: number;
  bestCombo: number;
  result: LessonSubmitResult;
}

const XP_BEFORE = 1200;

const SCENARIOS: Record<ScenarioKey, Scenario> = {
  perfect: {
    label: 'rewarded — leçon parfaite (8/8, série 8)',
    correctCount: 8,
    totalQuestions: 8,
    bestCombo: 8,
    result: {
      status: 'rewarded',
      xpAwarded: 115,
      breakdown: { base: 50, correct: 40, combo: 5, perfect: 20 },
      xpBefore: XP_BEFORE,
      xpAfter: XP_BEFORE + 115,
    },
  },
  normal: {
    label: 'rewarded — leçon normale (6/8, série 3)',
    correctCount: 6,
    totalQuestions: 8,
    bestCombo: 3,
    result: {
      status: 'rewarded',
      xpAwarded: 80,
      breakdown: { base: 50, correct: 30, combo: 0, perfect: 0 },
      xpBefore: XP_BEFORE,
      xpAfter: XP_BEFORE + 80,
    },
  },
  too_fast: {
    label: 'too_fast — bouclée trop vite',
    correctCount: 8,
    totalQuestions: 8,
    bestCombo: 8,
    result: { status: 'too_fast', xpAwarded: 0, xpBefore: XP_BEFORE, xpAfter: XP_BEFORE },
  },
  replay_cap: {
    label: 'replay_cap — plafond du jour atteint',
    correctCount: 6,
    totalQuestions: 8,
    bestCombo: 3,
    result: { status: 'replay_cap', xpAwarded: 0, xpBefore: XP_BEFORE, xpAfter: XP_BEFORE },
  },
  offline: {
    label: 'offline — serveur muet, aperçu local',
    correctCount: 6,
    totalQuestions: 8,
    bestCombo: 3,
    result: {
      status: 'offline',
      xpAwarded: 80,
      breakdown: { base: 50, correct: 30, combo: 0, perfect: 0 },
    },
  },
};

export function CompletionLabPanel() {
  const { enqueue, hold, release, pending, held } = useRewards();
  const [scenario, setScenario] = useState<ScenarioKey>('perfect');
  const [latency, setLatency] = useState(600);
  const [withRewards, setWithRewards] = useState(true);
  const [run, setRun] = useState(0);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const heldRef = useRef(false);

  const say = (line: string) =>
    setLog((prev) => [...prev, `${new Date().toISOString().slice(14, 23)} ${line}`]);

  const start = () => {
    setLog([]);
    setRun((n) => n + 1);
    setOpen(true);
    hold();
    heldRef.current = true;
    say('hold() — le Director est tenu');
  };

  const stop = useCallback(() => {
    if (heldRef.current) {
      heldRef.current = false;
      release();
    }
    setOpen(false);
  }, [release]);

  const current = SCENARIOS[scenario];

  const submit = useCallback(async (): Promise<LessonSubmitResult> => {
    say(`submit() lancé — latence ${latency} ms`);
    await new Promise((r) => setTimeout(r, latency));
    if (withRewards) {
      // Enfilées pendant la soumission, Director encore tenu : rien ne doit
      // apparaître avant la fin de la chorégraphie.
      enqueue({ kind: 'streak', id: `lab-${Date.now()}`, days: 7, xp: 20 });
      enqueue({ kind: 'badge', id: `lab-badge-${Date.now()}`, label: 'Premiers mots', emoji: '🗣️' });
      enqueue({ kind: 'levelUp', id: `lab-level-${Date.now()}`, level: 'A2', previousLevel: 'A1' });
      say('3 récompenses enfilées (série, badge, niveau)');
    }
    say(`réponse serveur : ${SCENARIOS[scenario].result.status}`);
    return SCENARIOS[scenario].result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latency, withRewards, enqueue, scenario, run]);

  const onSettled = useCallback(() => {
    say('onSettled → release() : les célébrations peuvent passer');
    if (heldRef.current) {
      heldRef.current = false;
      release();
    }
  }, [release]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Scénario serveur</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={scenario === key ? 'default' : 'outline'}
                onClick={() => setScenario(key)}
              >
                {key}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{current.label}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Latence serveur — {latency} ms</Label>
          <Slider
            min={0}
            max={2000}
            step={100}
            value={[latency]}
            onValueChange={([v]) => setLatency(v)}
          />
          <div className="flex items-center gap-2">
            <Switch
              id="lab-rewards"
              checked={withRewards}
              onCheckedChange={setWithRewards}
            />
            <Label htmlFor="lab-rewards" className="text-xs">
              Enfiler série + badge + passage de niveau
            </Label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={start}>{open ? 'Rejouer' : 'Lancer l’écran de fin'}</Button>
        {open && (
          <Button variant="ghost" onClick={stop}>
            Fermer
          </Button>
        )}
        <span className="font-mono text-xs text-muted-foreground">
          file : {pending} · {held ? 'tenue' : 'libre'}
        </span>
      </div>

      {log.length > 0 && (
        <ul className="space-y-0.5 rounded-lg bg-muted/50 p-3 font-mono text-[11px] text-muted-foreground">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-background p-4">
          <CompletionScreen
            key={run}
            courseTitle="Motion Lab — écran de fin"
            totalSteps={10}
            durationSeconds={154}
            correctCount={current.correctCount}
            totalQuestions={current.totalQuestions}
            bestCombo={current.bestCombo}
            submit={submit}
            onSettled={onSettled}
            onContinue={stop}
          />
        </div>
      )}
    </div>
  );
}
