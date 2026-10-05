import { readCourseProgressMap } from './courseProgress';
import { todayKey } from './dailyChallenge';

/**
 * Objectif du jour — ce que l'en-tête du parcours annonce à côté de la série
 * et de l'XP.
 *
 * Le compte se lit dans la progression déjà stockée : une leçon terminée porte
 * sa date, il n'y a pas de second journal à tenir. Le jour est celui de Paris,
 * **le même que le défi du jour** (`todayKey`), pour qu'un apprenant ne voie
 * jamais deux « aujourd'hui » différents dans la même application.
 *
 * Invariant respecté : jamais de culpabilisation. L'objectif se remplit, il ne
 * se vide pas, et rien n'annonce ce qui manque.
 */

/** Trois leçons. Court assez pour être atteint un soir de semaine. */
export const DAILY_GOAL_TARGET = 3;

/** Leçons terminées aujourd'hui. Plafonné nulle part : l'appelant décide. */
export function lessonsDoneToday(now = new Date()): number {
  const today = todayKey(now);
  let done = 0;
  for (const entry of Object.values(readCourseProgressMap())) {
    if (!entry?.completed || !entry.date) continue;
    const at = new Date(entry.date);
    if (Number.isNaN(at.getTime())) continue;
    if (todayKey(at) === today) done += 1;
  }
  return done;
}
