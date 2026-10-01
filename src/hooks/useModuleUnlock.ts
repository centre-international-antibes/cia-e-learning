import { useMemo } from 'react';
import { curriculum, type Module } from '@/data/curriculum';
import { readCourseProgressMap, type CourseProgressMap } from '@/lib/courseProgress';
import type { CECRLevel } from '@/data/demo-courses';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type CurriculumLevel = (typeof LEVEL_ORDER)[number];

function getSavedProgress(): CourseProgressMap {
  return readCourseProgressMap();
}

export function getModuleCompletionPercent(mod: Module): number {
  const savedProgress = getSavedProgress();
  const completed = mod.lessons.filter((l) => savedProgress[`lesson-${l.id}`]?.completed).length;
  return Math.round((completed / mod.lessons.length) * 100);
}

export function isModuleComplete(mod: Module): boolean {
  return getModuleCompletionPercent(mod) === 100;
}

/**
 * Avancement pédagogique dans un niveau : part des leçons terminées sur
 * l'ensemble des leçons du niveau. C'est ce que montre le profil, à la place
 * de l'ancienne barre « XP vers le prochain niveau » — l'XP ne fait plus
 * progresser le niveau.
 */
export function getLevelCompletionPercent(level: CECRLevel): number {
  const levelData = curriculum.find((l) => l.level === level);
  if (!levelData) return 0;
  const savedProgress = getSavedProgress();
  const lessons = levelData.modules.flatMap((m) => m.lessons);
  if (lessons.length === 0) return 0;
  const done = lessons.filter((l) => savedProgress[`lesson-${l.id}`]?.completed).length;
  return Math.round((done / lessons.length) * 100);
}

/**
 * Module unlock rules:
 * 1. A1.1 is always unlocked
 * 2. Within same level: module X requires module X-1 to be 100% complete
 * 3. Cross-level: level N+1 module X requires level N module X to be 100% complete
 */
export function isModuleUnlocked(moduleId: string): boolean {
  const [levelStr, modNumStr] = moduleId.split('.');
  const modNum = parseInt(modNumStr, 10);
  const levelIdx = (LEVEL_ORDER as readonly string[]).indexOf(levelStr);

  if (levelIdx === 0 && modNum === 1) return true;

  const findModule = (level: string, num: number): Module | undefined => {
    const levelData = curriculum.find((l) => l.level === level);
    return levelData?.modules.find((m) => m.number === num);
  };

  if (modNum > 1) {
    const prevInLevel = findModule(levelStr, modNum - 1);
    if (!prevInLevel || !isModuleComplete(prevInLevel)) return false;
  }

  if (levelIdx > 0) {
    const prevLevel = LEVEL_ORDER[levelIdx - 1];
    const prevLevelModule = findModule(prevLevel, modNum);
    if (!prevLevelModule || !isModuleComplete(prevLevelModule)) return false;
  }

  return true;
}

/** Get all completed module badges */
export function getEarnedBadges(): {
  moduleId: string;
  badge: string;
  badgeEmoji: string;
  title: string;
}[] {
  const badges: { moduleId: string; badge: string; badgeEmoji: string; title: string }[] = [];
  for (const levelData of curriculum) {
    for (const mod of levelData.modules) {
      if (isModuleComplete(mod)) {
        badges.push({
          moduleId: mod.id,
          badge: mod.badge,
          badgeEmoji: mod.badgeEmoji,
          title: mod.title,
        });
      }
    }
  }
  return badges;
}

/** Compute current CECR level from module completion */
export function computeLevelFromProgress(): CECRLevel {
  let currentLevel: CurriculumLevel = 'A1';
  for (const levelData of curriculum) {
    const allComplete = levelData.modules.every((m) => isModuleComplete(m));
    if (allComplete) {
      const idx = LEVEL_ORDER.indexOf(levelData.level as CurriculumLevel);
      if (idx >= 0 && idx + 1 < LEVEL_ORDER.length) {
        currentLevel = LEVEL_ORDER[idx + 1];
      } else if (idx >= 0) {
        currentLevel = levelData.level as CurriculumLevel; // Already at max
      }
    }
  }
  return currentLevel;
}

/**
 * Given a module that was just completed, return the list of newly unlocked modules.
 */
export function getNewlyUnlockedModules(completedModuleId: string): Module[] {
  const [levelStr, modNumStr] = completedModuleId.split('.');
  const modNum = parseInt(modNumStr, 10);
  const levelIdx = (LEVEL_ORDER as readonly string[]).indexOf(levelStr);
  const unlocked: Module[] = [];

  const findModule = (level: string, num: number): Module | undefined => {
    const ld = curriculum.find((l) => l.level === level);
    return ld?.modules.find((m) => m.number === num);
  };

  // Next module in same level
  const nextInLevel = findModule(levelStr, modNum + 1);
  if (nextInLevel && isModuleUnlocked(nextInLevel.id)) {
    unlocked.push(nextInLevel);
  }

  // Same-numbered module in next level
  if (levelIdx + 1 < LEVEL_ORDER.length) {
    const nextLevelMod = findModule(LEVEL_ORDER[levelIdx + 1], modNum);
    if (nextLevelMod && isModuleUnlocked(nextLevelMod.id)) {
      unlocked.push(nextLevelMod);
    }
  }

  return unlocked;
}

export function useModuleUnlock() {
  const unlockedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const levelData of curriculum) {
      for (const mod of levelData.modules) {
        map[mod.id] = isModuleUnlocked(mod.id);
      }
    }
    return map;
  }, []);

  return {
    isUnlocked: (moduleId: string) => unlockedMap[moduleId] ?? false,
    getProgress: getModuleCompletionPercent,
  };
}
