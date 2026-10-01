import { toast as sonnerToast, type ExternalToast } from 'sonner';

const DURATIONS = {
  success: 3000,
  error: 5000,
  info: 3500,
  warning: 4500,
  gamification: 5000,
};

type Opts = ExternalToast;

export const notify = {
  success: (title: string, opts?: Opts) =>
    sonnerToast.success(title, { duration: DURATIONS.success, ...opts }),

  error: (title: string, opts?: Opts) =>
    sonnerToast.error(title, { duration: DURATIONS.error, ...opts }),

  info: (title: string, opts?: Opts) =>
    sonnerToast.info(title, { duration: DURATIONS.info, ...opts }),

  warning: (title: string, opts?: Opts) =>
    sonnerToast.warning(title, { duration: DURATIONS.warning, ...opts }),

  message: (title: string, opts?: Opts) => sonnerToast(title, opts),

  loading: (title: string, opts?: Opts) => sonnerToast.loading(title, opts),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  promise: sonnerToast.promise,

  // ----- Gamification -----
  // Ces trois helpers ne sont appelés que par la scène du Reward Director,
  // qui décide seule du moment où une récompense s'affiche. Les appeler
  // directement remettrait des toasts concurrents à l'écran.
  //
  // `xp` et `levelUp` ont été retirés : l'XP passe par `enqueue({ kind: 'xp' })`
  // et le passage de niveau par la célébration plein écran.
  streak: (days: number, xp?: number) =>
    sonnerToast.success(`Défi du jour validé !`, {
      description: `Série : ${days} jour${days > 1 ? 's' : ''}${xp ? ` · +${xp} XP` : ''}`,
      duration: DURATIONS.gamification,
      icon: '🔥',
    }),

  badge: (label: string, emoji?: string) =>
    sonnerToast.success(`Badge obtenu`, {
      description: `${emoji ? emoji + ' ' : ''}${label}`,
      duration: DURATIONS.gamification,
      icon: '🏅',
    }),

  unlock: (label: string, emoji?: string) =>
    sonnerToast(`Module débloqué`, {
      description: `${emoji ? emoji + ' ' : ''}${label}`,
      duration: DURATIONS.gamification,
      icon: '🔓',
    }),
};

// re-export for convenience
export { sonnerToast as toast };
