import { useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { Button } from '@/components/ui/button';
import { Pressable, type PressableDepth, type PressableTone } from '@/components/ui/pressable';
import { RollingNumber } from '@/components/ui/rolling-number';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { spring } from '@/lib/motion';
import { feedback, MAX_COMBO_STEP, playSound, type SoundName } from '@/lib/feedback';
import { useOptionalRewards } from '@/features/rewards';
import { PlayerLabPanel } from './PlayerLabPanel';

/**
 * Motion Lab — banc d'essai des primitives M1.
 *
 * Sert à valider le mouvement dans la preview, à la main et en conditions
 * réelles : springs côte à côte, enfoncement des surfaces, compteur qui
 * roule, sons, et bascule « reduced motion » pour vérifier que tout reste
 * utilisable sans animation.
 */

const SPRING_NAMES = ['snappy', 'bouncy', 'gentle', 'slow'] as const;
const TONES: PressableTone[] = ['primary', 'gold', 'success', 'danger', 'neutral'];
const DEPTHS: PressableDepth[] = ['sm', 'md', 'lg'];
const BUTTON_VARIANTS = [
  'default',
  'gold',
  'success',
  'destructive',
  'outline',
  'ghost',
  'link',
] as const;
const SOUNDS: SoundName[] = [
  'tap',
  'select',
  'correct',
  'wrong',
  'complete',
  'levelUp',
  'chest',
  'whoosh',
];

function SpringDemo({ name }: { name: (typeof SPRING_NAMES)[number] }) {
  const [run, setRun] = useState(0);
  const token = spring[name];
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm font-semibold">{name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {token.stiffness} / {token.damping} / {token.mass}
        </span>
      </div>
      <div className="relative h-20 overflow-hidden rounded-lg bg-muted/40">
        <motion.div
          key={run}
          className="absolute left-3 top-3 h-10 w-10 rounded-lg bg-primary"
          initial={{ x: 0 }}
          animate={{ x: 'calc(100% + 9rem)' }}
          transition={token}
        />
      </div>
      <Button variant="outline" size="sm" onClick={() => setRun((r) => r + 1)}>
        Rejouer
      </Button>
    </div>
  );
}

export default function MotionLab() {
  const [simulateReduced, setSimulateReduced] = useState(false);
  const [xp, setXp] = useState(120);
  const [comboStep, setComboStep] = useState(0);
  const [selectedTone, setSelectedTone] = useState<PressableTone | null>('neutral');

  return (
    <MotionConfig reducedMotion={simulateReduced ? 'always' : 'user'}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Motion Lab"
          description="Banc d'essai des primitives de mouvement, de profondeur et de feedback (M1)."
        />

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
          <SoundToggle />
          <div className="flex items-center gap-2">
            <Switch
              id="reduced-motion"
              checked={simulateReduced}
              onCheckedChange={setSimulateReduced}
            />
            <Label htmlFor="reduced-motion">Simuler « animations réduites »</Label>
          </div>
        </div>

        <AdminSectionCard title="Springs" description="Les quatre ressorts du système.">
          <div className="grid gap-4 sm:grid-cols-2">
            {SPRING_NAMES.map((name) => (
              <SpringDemo key={name} name={name} />
            ))}
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Pressable"
          description="Enfoncement vertical seul : la surface descend de sa profondeur, l'ombre disparaît."
        >
          <div className="space-y-4">
            {DEPTHS.map((depth) => (
              <div key={depth} className="flex flex-wrap items-center gap-3">
                <span className="w-8 font-mono text-xs text-muted-foreground">{depth}</span>
                {TONES.map((tone) => (
                  <Pressable key={tone} tone={tone} depth={depth}>
                    {tone}
                  </Pressable>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <span className="w-full text-xs text-muted-foreground sm:w-auto">
                État sélectionné (<code>pressed</code>) — comme une option de QCM :
              </span>
              {TONES.map((tone) => (
                <Pressable
                  key={tone}
                  tone={tone}
                  depth="md"
                  pressed={selectedTone === tone}
                  onClick={() => setSelectedTone(tone)}
                >
                  {tone}
                </Pressable>
              ))}
              <Pressable tone="primary" depth="md" disabled>
                disabled
              </Pressable>
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard title="Button" description="Variantes cibles après consolidation.">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="RollingNumber"
          description="Anime depuis la valeur affichée, jamais depuis zéro."
        >
          <div className="flex flex-wrap items-center gap-4">
            <RollingNumber value={xp} suffix=" XP" bump className="text-3xl font-bold" />
            <div className="flex flex-wrap gap-2">
              {[5, 50, 500].map((delta) => (
                <Button key={delta} variant="outline" onClick={() => setXp((v) => v + delta)}>
                  +{delta}
                </Button>
              ))}
              <Button variant="ghost" onClick={() => setXp(0)}>
                reset
              </Button>
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Sons & haptique"
          description="Synthèse Web Audio — aucun fichier audio. Le son suit le réglage ci-dessus."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SOUNDS.map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={() => playSound(name, { step: comboStep, scope: 'player' })}
                >
                  {name}
                </Button>
              ))}
            </div>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="combo">
                Combo de <code>correct()</code> : palier{' '}
                <span className="tabular-nums">{comboStep}</span> / {MAX_COMBO_STEP}
              </Label>
              <Slider
                id="combo"
                min={0}
                max={MAX_COMBO_STEP}
                step={1}
                value={[comboStep]}
                onValueChange={([v]) => setComboStep(v)}
              />
              <Button
                variant="success"
                onClick={() => feedback.correct(comboStep, { scope: 'player' })}
              >
                Jouer correct({comboStep})
              </Button>
            </div>
          </div>
        </AdminSectionCard>
        <AdminSectionCard
          title="Player"
          description="Mini-leçon jouable : CheckBar, sélection avant validation, combo, rejeu des erreurs."
        >
          <PlayerLabPanel />
        </AdminSectionCard>

        <AdminSectionCard
          title="Reward Director"
          description="Une célébration à la fois, les macro en dernier, rien pendant une leçon."
        >
          <RewardDirectorPanel />
        </AdminSectionCard>
      </div>
    </MotionConfig>
  );
}

/**
 * Banc d'essai de la file des récompenses : on enfile une rafale et on
 * vérifie qu'elles passent une par une, le passage de niveau en dernier.
 */
function RewardDirectorPanel() {
  const rewards = useOptionalRewards();
  const [holding, setHolding] = useState(false);

  if (!rewards) {
    return (
      <p className="text-sm text-muted-foreground">
        Reward Director non monté (cette page est rendue hors de l'application).
      </p>
    );
  }

  const burst = () => {
    const stamp = Date.now();
    rewards.enqueue({ kind: 'xp', id: `lab-${stamp}`, amount: 115, label: 'Leçon terminée' });
    rewards.enqueue({
      kind: 'badge',
      id: `lab-${stamp}`,
      label: 'Bienvenue à Antibes',
      emoji: '🏖️',
    });
    rewards.enqueue({ kind: 'levelUp', id: `lab-${stamp}`, level: 'A2', previousLevel: 'A1' });
    rewards.enqueue({
      kind: 'unlock',
      id: `lab-${stamp}`,
      label: 'A1.2 — Mon monde quotidien',
      emoji: '🧭',
    });
  };

  const toggleHold = () => {
    if (holding) rewards.release();
    else rewards.hold();
    setHolding((h) => !h);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={burst}>Enfiler xp + badge + unlock + levelUp</Button>
        <Button variant="outline" onClick={toggleHold} aria-pressed={holding}>
          {holding ? 'release()' : 'hold()'}
        </Button>
        <Button variant="ghost" onClick={rewards.skip} disabled={!rewards.current}>
          Passer
        </Button>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        file : {rewards.pending} · courante : {rewards.current?.kind ?? '—'} ·{' '}
        {rewards.held ? 'retenue (hold)' : 'active'}
      </p>
      <p className="text-xs text-muted-foreground">
        Attendu : le badge et le module débloqué passent en toast, l'XP en burst, et la modale de
        niveau arrive <strong>en dernier</strong>, jamais par-dessus une autre.
      </p>
    </div>
  );
}
