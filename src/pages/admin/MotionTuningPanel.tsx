import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Lock, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Spark } from '@/components/spark/Spark';
import {
  BANDS,
  PRESET_NAMES,
  PRESETS,
  describeSpring,
  type MotionPreset,
  type PresetName,
} from '@/lib/motion/presets';
import { useTuning } from '@/lib/motion/tuning';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Réglage des presets — le banc où les valeurs se décident.
 *
 * Les chiffres de `presets.ts` sont un point de départ mesuré, pas un verdict.
 * Ici on les bouge au doigt, on rejoue les moments signature juste à côté, et
 * on lit en temps réel ce que ça donne : arrivée, dépassement, stabilisation.
 *
 * Les réglages persistent dans le navigateur. Une fois validés sur téléphone,
 * « Copier les valeurs » rend le bloc à recopier dans `presets.ts` et MOTION.md.
 */

const BAND_LABEL: Record<MotionPreset['band'], string> = {
  micro: 'micro-interaction',
  transition: 'transition',
  moment: 'moment fort',
};

function PresetRow({ name }: { name: PresetName }) {
  const { getPreset, setPreset, resetPreset } = useTuning();
  const p = getPreset(name);
  const def = PRESETS[name];
  const touched = p.visualDuration !== def.visualDuration || p.bounce !== def.bounce;
  const [lo, hi] = BANDS[def.band];
  const d = describeSpring(p.visualDuration, p.bounce);
  const inBand = d.arrive >= lo && d.arrive <= hi;

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <span className="font-display text-sm font-semibold">{name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{def.usage}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!def.inUse && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              nouveau
            </span>
          )}
          {touched && (
            <Button size="sm" variant="ghost" onClick={() => resetPreset(name)}>
              Défaut
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px]">arrivée visée — {p.visualDuration.toFixed(3)} s</Label>
          <Slider
            min={0.05}
            max={1.2}
            step={0.005}
            value={[p.visualDuration]}
            onValueChange={([v]) => setPreset(name, { visualDuration: v, bounce: p.bounce })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">rebond — {p.bounce.toFixed(2)}</Label>
          <Slider
            min={0}
            max={0.7}
            step={0.01}
            value={[p.bounce]}
            onValueChange={([v]) => setPreset(name, { visualDuration: p.visualDuration, bounce: v })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <span className={cn(!inBand && 'font-bold text-cia-red-600')}>arrivée {d.arrive} ms</span>
        <span>dépassement {d.overshoot} %</span>
        <span>stabilisé {d.settle} ms</span>
        <span className="opacity-70">
          {BAND_LABEL[def.band]} : {lo}–{hi} ms{inBand ? '' : ' — hors plage'}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────── Moments signature ────────────────────────── */

/** 1. Bonne réponse en série : le combo monte, la barre passe en or. */
function ComboMoment({ run }: { run: number }) {
  const { getSpring } = useTuning();
  return (
    <div className="space-y-2">
      <div className="relative h-2.5 overflow-hidden rounded-full bg-ink-100">
        <motion.div
          key={`bar-${run}`}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, hsl(var(--cia-gold-600)), hsl(var(--cia-gold-300)))',
          }}
          initial={{ width: '45%' }}
          animate={{ width: '70%' }}
          transition={getSpring('gentle')}
        />
      </div>
      <motion.div
        key={`badge-${run}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={getSpring('bouncy')}
        className="inline-flex items-center gap-1 rounded-full bg-cia-gold-500 px-2.5 py-1 text-xs font-bold text-cia-blue-900"
      >
        <Flame className="h-3.5 w-3.5" aria-hidden />×5
      </motion.div>
    </div>
  );
}

/** 2. Fin de leçon : les tuiles arrivent en cascade, le tampon frappe. */
function CompletionMoment({ run }: { run: number }) {
  const { getSpring } = useTuning();
  return (
    <div className="grid grid-cols-3 gap-2">
      {['+115', '100 %', '8'].map((v, i) => (
        <motion.div
          key={`${run}-${i}`}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...getSpring('gentle'), delay: i * stagger.loose }}
          className="relative rounded-xl border border-ink-100 bg-card p-2 text-center"
        >
          <p className="font-display text-base font-extrabold text-cia-blue-700">{v}</p>
          {i === 1 && (
            <motion.span
              key={`stamp-${run}`}
              initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ ...getSpring('stamp'), delay: 0.5 }}
              className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-cia-gold-500 bg-cia-gold-100 px-1.5 text-[9px] font-extrabold uppercase text-cia-gold-700"
            >
              Parfait
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/** 3. Nœud du parcours débloqué : le nœud se tamponne, Spark saute au suivant. */
function UnlockMoment({ run }: { run: number }) {
  const { getSpring } = useTuning();
  return (
    <div className="relative flex h-24 items-center justify-between px-6">
      <motion.div
        key={`done-${run}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.92, 1] }}
        transition={getSpring('press')}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-cia-blue-500 text-white"
        style={{ boxShadow: '0 6px 0 0 hsl(var(--cia-blue-700))' }}
      >
        <Star className="h-6 w-6 fill-current" aria-hidden />
      </motion.div>

      <motion.div
        key={`spark-${run}`}
        initial={{ x: -110, y: 0 }}
        animate={{ x: 0, y: [0, -34, 0] }}
        transition={getSpring('hero')}
      >
        <Spark mood="celebrating" size={48} halo />
      </motion.div>

      <motion.div
        key={`next-${run}`}
        initial={{ scale: 1, opacity: 0.45 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...getSpring('bouncy'), delay: 0.45 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-cia-blue-500 text-white"
        style={{ boxShadow: '0 6px 0 0 hsl(var(--cia-blue-700))' }}
      >
        <Lock className="h-5 w-5" aria-hidden />
      </motion.div>
    </div>
  );
}

/** 4. Passage de niveau CECR : la carte arrive de loin et se pose. */
function LevelMoment({ run }: { run: number }) {
  const { getSpring } = useTuning();
  return (
    <div className="flex h-24 items-center justify-center">
      <motion.div
        key={run}
        initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={getSpring('hero')}
        className="rounded-2xl bg-cia-blue-700 px-8 py-4 text-center text-white"
        style={{ boxShadow: '0 8px 0 0 hsl(var(--cia-blue-900))' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/70">Niveau</p>
        <p className="font-display text-3xl font-extrabold">A2</p>
      </motion.div>
    </div>
  );
}

/** 5. Palier de série : la flamme grossit, le chiffre encaisse. */
function StreakMoment({ run }: { run: number }) {
  const { getSpring } = useTuning();
  return (
    <div className="flex h-24 items-center justify-center gap-3">
      <motion.div
        key={`f-${run}`}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={getSpring('hero')}
      >
        <Flame className="h-12 w-12 fill-streak-500 text-streak-500" aria-hidden />
      </motion.div>
      <motion.p
        key={`n-${run}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...getSpring('bouncy'), delay: 0.18 }}
        className="font-display text-4xl font-extrabold text-streak-500"
      >
        7
      </motion.p>
    </div>
  );
}

const MOMENTS = [
  ['Bonne réponse en série', ComboMoment],
  ['Fin de leçon', CompletionMoment],
  ['Nœud débloqué', UnlockMoment],
  ['Passage de niveau', LevelMoment],
  ['Palier de série', StreakMoment],
] as const;

export function MotionTuningPanel() {
  const { resetAll, exportTuning } = useTuning();
  const [run, setRun] = useState(0);
  const [copied, setCopied] = useState(false);

  const replay = () => setRun((n) => n + 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={replay}>Rejouer les moments</Button>
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard?.writeText(exportTuning());
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? 'Copié' : 'Copier les valeurs'}
        </Button>
        <Button variant="ghost" onClick={resetAll}>
          Tout remettre par défaut
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Les réglages restent dans ce navigateur. Les chiffres sous chaque curseur sont calculés
        avec la résolution de ressort de framer-motion : c’est ce que l’app jouera. Mais c’est
        l’œil qui tranche, sur téléphone.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          {PRESET_NAMES.map((n) => (
            <PresetRow key={n} name={n} />
          ))}
        </div>

        <div className="space-y-2">
          {MOMENTS.map(([label, Comp]) => (
            <div key={label} className="rounded-xl border border-border p-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">
                {label}
              </p>
              <Comp run={run} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
