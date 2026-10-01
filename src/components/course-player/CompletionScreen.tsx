import * as React from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Pressable } from '@/components/ui/pressable';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Spark } from '@/components/spark/Spark';
import { feedback } from '@/lib/feedback';
import { spring, stagger } from '@/lib/motion';
import { computeLessonXp } from '@/lib/xp/lessonXp';
import type { LessonSubmitResult, LessonSubmitStatus, LessonXpParts } from './lesson-result';

/**
 * Écran de fin de leçon.
 *
 * Trois choses se passent en même temps, et c'est voulu :
 *   1. la soumission part dès le montage — une seule fois, garde par ref ;
 *   2. la chorégraphie joue sans l'attendre (Spark, titre, tuiles, tampon, CTA) ;
 *   3. la tuile XP, elle, attend la réponse du serveur : on n'annonce jamais un
 *      montant que le serveur n'a pas accordé.
 *
 * `onSettled` n'est appelé qu'une fois la chorégraphie terminée **et** la
 * réponse reçue : c'est le signal que le player attend pour relâcher le Reward
 * Director, de sorte qu'aucune célébration ne vienne couper la révélation.
 */

/** Repères de la chorégraphie, en millisecondes depuis le montage. */
const AT = {
  spark: 0,
  title: 200,
  tiles: 400,
  stamp: 1100,
  cta: 1300,
} as const;

/** Délai entre la pose d'une tuile et le départ de son compteur. */
const ROLL_DELAY = 160;
/** Filet si le compteur n'émet pas son `onSettle`. */
const ROLL_FALLBACK = 900;

/** Durée du vol d'une particule, en secondes. */
const FLIGHT_DURATION = 0.7;
/** Décalage entre deux particules, en secondes. */
const FLIGHT_STAGGER = 0.04;
/** Au-delà, les sons d'arrivée se marchent dessus. */
const MAX_FLIGHT_SOUNDS = 4;

/** Même palette que les éclats de `XPBurst`, pour que l'or soit le même partout. */
const SHARD_COLORS = ['#CCAE62', '#E8C97A', '#F2D89A', '#FFD700', '#FFFFFF'];

/** Mention neutre associée au statut. `rewarded` n'a rien à dire. */
const STATUS_NOTE: Record<LessonSubmitStatus, string | null> = {
  rewarded: null,
  anonymous: null,
  too_fast: 'player.completion.xpTooFast',
  replay_cap: 'player.completion.xpReplayCap',
  offline: 'player.completion.xpOffline',
};

/**
 * Valeur d'une tuile. Posée (skip ou reduced-motion), elle s'écrit directement :
 * un ressort qui court encore après un skip, ce n'est plus un état final.
 */
function TileValue({
  value,
  posed,
  prefix = '',
  suffix = '',
  bump,
  onSettle,
  className,
}: {
  value: number;
  posed: boolean;
  prefix?: string;
  suffix?: string;
  bump?: boolean;
  onSettle?: () => void;
  className?: string;
}) {
  const { i18n } = useTranslation();
  if (posed) {
    return (
      <span className={`tabular-nums font-display ${className ?? ''}`}>
        {prefix}
        {value.toLocaleString(i18n.language || 'fr')}
        {suffix}
      </span>
    );
  }
  return (
    <RollingNumber
      value={value}
      prefix={prefix}
      suffix={suffix}
      bump={bump}
      onSettle={onSettle}
      className={className}
    />
  );
}

export interface CompletionScreenProps {
  courseTitle: string;
  totalSteps: number;
  durationSeconds: number;
  correctCount: number;
  totalQuestions: number;
  bestCombo: number;
  /**
   * Soumet la leçon. Appelée **exactement une fois** par instance, au montage.
   * La tuile XP reste en attente jusqu'à la résolution.
   */
  submit: () => Promise<LessonSubmitResult>;
  /** Chorégraphie terminée ET soumission résolue. Appelé une seule fois. */
  onSettled?: () => void;
  /** Le CTA « Continuer ». */
  onContinue: () => void;
}

export function CompletionScreen({
  courseTitle,
  totalSteps,
  durationSeconds,
  correctCount,
  totalQuestions,
  bestCombo,
  submit,
  onSettled,
  onContinue,
}: CompletionScreenProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotionConfig() ?? false;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const xpTileRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLDivElement>(null);

  /* ── Soumission : une fois, et une seule ───────────────────────────────── */
  const [result, setResult] = React.useState<LessonSubmitResult | null>(null);
  const submittedRef = React.useRef(false);
  React.useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    // Pas de drapeau « monté » ici : en StrictMode le nettoyage du premier
    // passage l'invaliderait alors que la garde empêche le second appel, et la
    // réponse serait jetée. Un `setState` après démontage est sans effet.
    submit()
      .then(setResult)
      .catch((error) => {
        // La page garde la main sur ses erreurs ; l'écran de fin, lui, ne
        // reste jamais bloqué sur une attente.
        console.error('[CompletionScreen] submit', error);
        setResult({ status: 'offline', xpAwarded: 0 });
      });
  }, [submit]);

  /* ── Chorégraphie ──────────────────────────────────────────────────────── */
  // `instant` : tout est posé, sans animation — reduced-motion ou skip.
  const [instant, setInstant] = React.useState(reduced);
  const [stage, setStage] = React.useState(reduced ? AT.cta : -1);
  const [rolled, setRolled] = React.useState(reduced);

  // `useReducedMotion` ne connaît la préférence qu'après son premier effet :
  // l'initialiseur de `useState` ne suffit pas, il faut suivre le changement.
  const completePlayed = React.useRef(false);
  const playComplete = React.useCallback(() => {
    if (completePlayed.current) return;
    completePlayed.current = true;
    feedback.complete({ scope: 'player' });
  }, []);

  React.useEffect(() => {
    if (reduced) {
      setInstant(true);
      setStage(AT.cta);
      setRolled(true);
      playComplete();
      return;
    }
    const timers = [
      window.setTimeout(() => {
        setStage(AT.spark);
        playComplete();
      }, AT.spark),
      window.setTimeout(() => setStage(AT.title), AT.title),
      window.setTimeout(() => setStage(AT.tiles), AT.tiles),
      window.setTimeout(() => setRolled(true), AT.tiles + ROLL_DELAY),
      window.setTimeout(() => setStage(AT.stamp), AT.stamp),
      window.setTimeout(() => setStage(AT.cta), AT.cta),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reduced, playComplete]);

  /** Saute à l'état final : toutes les valeurs posées, CTA visible. */
  const skip = React.useCallback(() => {
    setInstant(true);
    setStage(AT.cta);
    setRolled(true);
  }, []);

  const perfect = totalQuestions > 0 && correctCount === totalQuestions;
  const shown = (at: number) => stage >= at;
  const posed = instant || reduced;

  /* ── Le tampon « Parfait ! » frappe avec son son ───────────────────────── */
  const stampPlayed = React.useRef(false);
  React.useEffect(() => {
    if (!perfect || stage < AT.stamp || stampPlayed.current) return;
    stampPlayed.current = true;
    if (!posed) feedback.chest({ scope: 'player' });
  }, [perfect, stage, posed]);

  /* ── La tuile XP ne roule qu'une fois le serveur revenu ────────────────── */
  const xpAwarded = result?.xpAwarded ?? 0;
  const xpBefore = result?.xpBefore;
  const xpAfter = result?.xpAfter;
  const hasPill = typeof xpBefore === 'number' && typeof xpAfter === 'number';

  // Le compteur se monte à 0 puis reçoit la valeur : c'est la seule exception
  // au « jamais depuis zéro », parce qu'il s'agit d'une première révélation.
  const [xpRevealed, setXpRevealed] = React.useState(false);
  React.useEffect(() => {
    if (!result || !rolled || xpRevealed) return;
    const timer = window.setTimeout(() => setXpRevealed(true), 0);
    return () => window.clearTimeout(timer);
  }, [result, rolled, xpRevealed]);

  /* ── XP qui vole ───────────────────────────────────────────────────────── */
  const needsFlight = xpAwarded > 0 && hasPill && !posed;
  const [flightStarted, setFlightStarted] = React.useState(false);
  const [flightEnded, setFlightEnded] = React.useState(false);
  const endFlight = React.useCallback(() => setFlightEnded(true), []);
  const flightDone = !needsFlight || flightEnded;

  React.useEffect(() => {
    if (!needsFlight || !xpRevealed || flightStarted) return;
    const timer = window.setTimeout(() => setFlightStarted(true), ROLL_FALLBACK);
    return () => window.clearTimeout(timer);
  }, [needsFlight, xpRevealed, flightStarted]);

  // La pastille ne roule qu'une fois les éclats arrivés.
  const pillValue = hasPill ? (flightDone ? xpAfter : xpBefore) : 0;

  /* ── Signal au player : chorégraphie finie ET réponse reçue ────────────── */
  const settledRef = React.useRef(false);
  const settled = stage >= AT.cta && result !== null && flightDone;
  React.useEffect(() => {
    if (settledRef.current || !settled) return;
    settledRef.current = true;
    onSettled?.();
  }, [settled, onSettled]);

  /* ── Skip au tap / Échap ; Entrée = Continuer ──────────────────────────── */
  const ctaVisible = stage >= AT.cta;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !settledRef.current) {
        e.preventDefault();
        skip();
        return;
      }
      if (e.key === 'Enter' && ctaVisible) {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip, ctaVisible, onContinue]);

  const handleRootClick = (e: React.MouseEvent) => {
    // Le CTA garde son clic ; partout ailleurs, on saute la chorégraphie.
    if ((e.target as HTMLElement).closest('[data-cta]')) return;
    if (settledRef.current) return;
    skip();
  };

  /* ── Valeurs affichées ─────────────────────────────────────────────────── */
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : null;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const formattedTime = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Le serveur fait foi ; sans détail (anonyme, hors ligne), on reconstitue le
  // même barème localement pour ne pas afficher une tuile muette.
  const parts: LessonXpParts | null = React.useMemo(() => {
    if (!result) return null;
    if (result.breakdown) return result.breakdown;
    if (result.xpAwarded <= 0) return null;
    const local = computeLessonXp({
      correct: correctCount,
      questionCount: totalQuestions,
      bestCombo,
    });
    return { base: local.base, correct: local.correct, combo: local.combo, perfect: local.perfect };
  }, [result, correctCount, totalQuestions, bestCombo]);

  const note = result ? STATUS_NOTE[result.status] : null;

  /** Entrée d'un élément de la chorégraphie, ou état posé si on a sauté. */
  const enter = (at: number, from?: { y?: number; scale?: number; delay?: number }) =>
    posed
      ? ({ initial: false, animate: { opacity: 1, y: 0, scale: 1 } } as const)
      : ({
          initial: { opacity: 0, y: from?.y ?? 0, scale: from?.scale ?? 1 },
          animate: shown(at) ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0 },
          transition: { ...spring.gentle, delay: from?.delay ?? 0 },
        } as const);

  const tileClass = 'rounded-2xl border border-ink-100 bg-card p-3 shadow-elev-lg';
  const valueClass = 'text-xl font-extrabold text-cia-blue-700 sm:text-2xl';
  const labelClass = 'mt-1 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground';

  return (
    <div ref={rootRef} onClick={handleRootClick} className="relative mx-auto max-w-xl" data-completion>
      {/* Pastille « XP totale », en haut à droite — cible des éclats. */}
      {hasPill && (
        <motion.div
          ref={pillRef}
          {...enter(AT.spark, { scale: 0.8 })}
          className="absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-full border border-cia-gold-200 bg-cia-gold-50 px-3 py-1.5 shadow-elev-sm dark:border-cia-gold-800 dark:bg-cia-gold-900"
          data-xp-total
        >
          <span className="font-mono text-[9px] uppercase tracking-[.18em] text-cia-gold-700 dark:text-cia-gold-400">
            {t('player.completion.totalXp')}
          </span>
          <TileValue
            value={pillValue ?? 0}
            posed={posed}
            bump
            className="text-sm font-extrabold text-cia-gold-700 dark:text-cia-gold-300"
          />
        </motion.div>
      )}

      <div className="space-y-5 py-4 text-center">
        {/* Héros unique : Spark. Plus de trophée. */}
        <motion.div
          {...(posed
            ? ({ initial: false, animate: { opacity: 1, scale: 1 } } as const)
            : ({
                initial: { opacity: 0, scale: 0.6 },
                animate: shown(AT.spark) ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 },
                transition: spring.bouncy,
              } as const))}
          className="flex justify-center"
        >
          <Spark mood="celebrating" size={120} halo embers={!reduced} />
        </motion.div>

        <motion.div {...enter(AT.title, { y: 12 })} className="space-y-1">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.01em]">
            {perfect ? t('player.completion.titlePerfect') : t('player.completion.titleDone')}
          </h2>
          <p className="text-sm text-muted-foreground">{courseTitle}</p>
        </motion.div>

        <div className="grid grid-cols-3 items-start gap-2 sm:gap-3">
          {/* ── Tuile XP ── */}
          <motion.div
            ref={xpTileRef}
            {...enter(AT.tiles, { y: 16, scale: 0.96 })}
            className={tileClass}
            data-tile="xp"
          >
            {result ? (
              <TileValue
                value={xpRevealed ? xpAwarded : 0}
                posed={posed}
                prefix="+"
                bump
                onSettle={() => setFlightStarted(true)}
                className={valueClass}
              />
            ) : (
              <div
                className="mx-auto h-7 w-14 animate-shimmer rounded-md bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%]"
                role="status"
                aria-label={t('player.completion.xpPending')}
                data-xp-pending
              />
            )}
            <p className={labelClass}>{t('player.completion.xpLabel')}</p>
            {parts && (
              <ul
                className="mt-1.5 space-y-0.5 text-left text-[10px] leading-tight text-muted-foreground"
                data-xp-breakdown
              >
                {parts.base > 0 && (
                  <li>{t('player.completion.breakdown.lesson', { xp: parts.base })}</li>
                )}
                {parts.correct > 0 && (
                  <li>{t('player.completion.breakdown.correct', { xp: parts.correct })}</li>
                )}
                {parts.combo > 0 && (
                  <li>{t('player.completion.breakdown.combo', { xp: parts.combo })}</li>
                )}
                {parts.perfect > 0 && (
                  <li>{t('player.completion.breakdown.perfect', { xp: parts.perfect })}</li>
                )}
              </ul>
            )}
          </motion.div>

          {/* ── Tuile précision, porteuse du tampon ── */}
          <motion.div
            {...enter(AT.tiles, { y: 16, scale: 0.96, delay: stagger.loose })}
            className={`relative ${tileClass}`}
            data-tile="accuracy"
          >
            {accuracy === null ? (
              <p className={valueClass}>{totalSteps}</p>
            ) : (
              <TileValue value={rolled ? accuracy : 0} posed={posed} suffix=" %" className={valueClass} />
            )}
            <p className={labelClass}>
              {accuracy === null ? t('player.completion.steps') : t('player.completion.accuracy')}
            </p>
            {perfect && shown(AT.stamp) && (
              <motion.span
                {...(posed
                  ? ({ initial: false, animate: { opacity: 1, scale: 1, rotate: -8 } } as const)
                  : ({
                      initial: { opacity: 0, scale: 1.6, rotate: -8 },
                      animate: { opacity: 1, scale: 1, rotate: -8 },
                      transition: spring.bouncy,
                    } as const))}
                className="absolute -right-2 -top-2 rounded-full border-2 border-cia-gold-500 bg-cia-gold-100 px-2 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wide text-cia-gold-700 shadow-elev-sm dark:bg-cia-gold-900 dark:text-cia-gold-300"
                data-stamp
              >
                {t('player.perfect')}
              </motion.span>
            )}
          </motion.div>

          {/* ── Tuile meilleure série ── */}
          <motion.div
            {...enter(AT.tiles, { y: 16, scale: 0.96, delay: stagger.loose * 2 })}
            className={tileClass}
            data-tile="combo"
          >
            <TileValue value={rolled ? bestCombo : 0} posed={posed} className={valueClass} />
            <p className={labelClass}>{t('player.completion.bestCombo')}</p>
          </motion.div>
        </div>

        {/* Durée, et la mention de statut quand il y a quelque chose à dire. */}
        <motion.div {...enter(AT.tiles, { y: 8, delay: stagger.loose * 3 })} className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t('player.completion.durationLine', { time: formattedTime })}
          </p>
          {note && (
            <p className="text-xs text-muted-foreground" role="status" data-xp-note>
              {t(note)}
            </p>
          )}
        </motion.div>

        {/* Le CTA n'existe qu'une fois entré : pas de bouton focusable invisible. */}
        {ctaVisible && (
          <motion.div {...enter(AT.cta, { y: 12 })} className="flex justify-center">
            <Pressable
              data-cta
              tone="primary"
              depth="lg"
              scope="player"
              onClick={onContinue}
              className="h-14 min-w-[12rem] px-8 text-base"
            >
              {t('player.continue')}
            </Pressable>
          </motion.div>
        )}
      </div>

      {flightStarted && needsFlight && !flightEnded && (
        <XpFlight
          rootRef={rootRef}
          fromRef={xpTileRef}
          toRef={pillRef}
          amount={xpAwarded}
          onDone={endFlight}
        />
      )}
    </div>
  );
}

interface Shard {
  id: number;
  delay: number;
  size: number;
  color: string;
  bow: number;
  drift: number;
  spin: number;
}

/**
 * Les éclats d'or qui portent l'XP de la tuile vers la pastille.
 *
 * Trajectoire en arc : trois points (départ, sommet bombé, arrivée) suffisent à
 * lire une courbe, là où un trait droit fait « téléportation ».
 */
function XpFlight({
  rootRef,
  fromRef,
  toRef,
  amount,
  onDone,
}: {
  rootRef: React.RefObject<HTMLDivElement>;
  fromRef: React.RefObject<HTMLDivElement>;
  toRef: React.RefObject<HTMLDivElement>;
  amount: number;
  onDone: () => void;
}) {
  const [geometry, setGeometry] = React.useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!root || !from || !to) {
      onDone();
      return;
    }
    const r = root.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    setGeometry({
      from: { x: a.left + a.width / 2 - r.left, y: a.top + a.height / 2 - r.top },
      to: { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top },
    });
    // Une seule mesure : l'écran de fin ne bouge plus à ce moment-là.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6 à 10 éclats : assez pour faire une gerbe, pas assez pour faire du bruit.
  const shards = React.useMemo<Shard[]>(() => {
    const count = Math.min(10, Math.max(6, Math.round(amount / 15)));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: i * FLIGHT_STAGGER,
      size: 6 + Math.round(Math.random() * 5),
      color: SHARD_COLORS[i % SHARD_COLORS.length],
      bow: 50 + Math.random() * 50,
      drift: (Math.random() - 0.5) * 40,
      spin: (Math.random() - 0.5) * 360,
    }));
  }, [amount]);

  // Un `tap` par éclat arrivé, les quatre premiers seulement.
  React.useEffect(() => {
    if (!geometry) return;
    const last = shards[shards.length - 1];
    const timers = shards
      .slice(0, MAX_FLIGHT_SOUNDS)
      .map((s) =>
        window.setTimeout(
          () => feedback.tap({ scope: 'player' }),
          (s.delay + FLIGHT_DURATION) * 1000,
        ),
      );
    timers.push(window.setTimeout(onDone, (last.delay + FLIGHT_DURATION) * 1000 + 60));
    return () => timers.forEach(window.clearTimeout);
  }, [geometry, shards, onDone]);

  if (!geometry) return null;
  const { from, to } = geometry;
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      aria-hidden
      data-xp-flight
    >
      {shards.map((s) => (
        <motion.span
          key={s.id}
          className="absolute left-0 top-0 rounded-full"
          style={{
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            boxShadow: `0 0 6px ${s.color}`,
          }}
          initial={{ x: from.x, y: from.y, opacity: 0, scale: 0.4 }}
          animate={{
            x: [from.x, midX + s.drift, to.x],
            y: [from.y, midY - s.bow, to.y],
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1, 0.5],
            rotate: s.spin,
          }}
          transition={{
            duration: FLIGHT_DURATION,
            delay: s.delay,
            ease: [0.22, 0.8, 0.3, 1],
            times: [0, 0.55, 1],
            opacity: {
              duration: FLIGHT_DURATION,
              delay: s.delay,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />
      ))}
    </div>
  );
}
