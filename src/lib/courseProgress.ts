const ACTIVE_USER_STORAGE_KEY = 'cia-active-user-id';
const COURSE_PROGRESS_KEY = 'course-progress';
const COURSE_PLAYER_PROGRESS_PREFIX = 'course-player-progress';
const LAST_LESSON_OPENED_KEY = 'cia-last-lesson-opened';

export interface LastLessonOpened {
  courseId: string;
  moduleId?: string;
  title?: string;
  level?: string;
  openedAt: string;
}

export interface CourseProgressEntry {
  score?: number;
  completed?: boolean;
  date?: string;
}

export interface CoursePlayerProgress {
  step?: number;
  correctCount?: number;
  totalQuestions?: number;
  /** Série de bonnes réponses en cours. */
  combo?: number;
  /** Meilleure série de la tentative — elle compte dans le barème XP. */
  bestCombo?: number;
  /**
   * État complet du séquenceur du player (étape, score, file de rejeu).
   * Typé librement ici pour ne pas faire dépendre `lib/` d'un composant ;
   * la forme est celle de `PlayerState` (course-player/playerReducer).
   */
  player?: Record<string, unknown>;
}

export type CourseProgressMap = Record<string, CourseProgressEntry>;

function getScopedKey(baseKey: string) {
  if (typeof window === 'undefined') return baseKey;
  const activeUserId = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
  return activeUserId ? `${baseKey}:${activeUserId}` : baseKey;
}

export function setActiveProgressUser(userId: string | null | undefined) {
  if (typeof window === 'undefined') return;

  if (userId) {
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
    return;
  }

  window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
}

export function readCourseProgressMap(): CourseProgressMap {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(getScopedKey(COURSE_PROGRESS_KEY)) || '{}');
  } catch {
    return {};
  }
}

export function writeCourseProgressMap(progress: CourseProgressMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getScopedKey(COURSE_PROGRESS_KEY), JSON.stringify(progress));
}

function getCoursePlayerProgressKey(courseId: string) {
  return `${getScopedKey(COURSE_PLAYER_PROGRESS_PREFIX)}:${courseId}`;
}

export function readCoursePlayerProgress(courseId: string): CoursePlayerProgress | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getCoursePlayerProgressKey(courseId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCoursePlayerProgress(courseId: string, progress: CoursePlayerProgress) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getCoursePlayerProgressKey(courseId), JSON.stringify(progress));
}

export function clearCoursePlayerProgress(courseId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getCoursePlayerProgressKey(courseId));
}

export function setLastLessonOpened(payload: Omit<LastLessonOpened, 'openedAt'>) {
  if (typeof window === 'undefined') return;
  const entry: LastLessonOpened = { ...payload, openedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(getScopedKey(LAST_LESSON_OPENED_KEY), JSON.stringify(entry));
  } catch {
    /* noop */
  }
}

export function readLastLessonOpened(): LastLessonOpened | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getScopedKey(LAST_LESSON_OPENED_KEY));
    return raw ? (JSON.parse(raw) as LastLessonOpened) : null;
  } catch {
    return null;
  }
}
