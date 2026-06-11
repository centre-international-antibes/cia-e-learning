import { supabase } from '@/integrations/supabase/client';
import {
  readCourseProgressMap,
  writeCourseProgressMap,
  type CourseProgressEntry,
} from '@/lib/courseProgress';

export const LESSON_PROGRESS_EVENT = 'lesson-progress-update';

interface LessonProgressRow {
  lesson_id: string;
  course_id: string | null;
  level: string | null;
  score: number;
  best_score: number;
  completed: boolean;
  completed_at: string | null;
  last_played_at: string;
}

/**
 * Fetch all lesson_progress rows for the user and hydrate the
 * `course-progress:<userId>` localStorage cache so every existing
 * consumer (LearningPath, Curriculum, ModuleDrawer, ResumeCard,
 * useModuleUnlock, ...) keeps working without changes.
 */
export async function syncLessonProgressFromCloud(userId: string | null | undefined): Promise<void> {
  if (!userId) return;

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id, course_id, level, score, best_score, completed, completed_at, last_played_at')
    .eq('user_id', userId);

  if (error) {
    console.warn('[lessonProgressSync] fetch failed', error.message);
    return;
  }

  const rows = (data ?? []) as LessonProgressRow[];
  const local = readCourseProgressMap();
  const merged: Record<string, CourseProgressEntry> = { ...local };

  for (const row of rows) {
    merged[row.lesson_id] = {
      score: row.best_score ?? row.score ?? 0,
      completed: row.completed,
      date: row.completed_at ?? row.last_played_at,
    };
  }

  writeCourseProgressMap(merged);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LESSON_PROGRESS_EVENT));
  }
}

interface UpsertArgs {
  userId: string;
  lessonId: string;
  score: number;
  courseId?: string | null;
  level?: string | null;
  completed?: boolean;
}

/**
 * Persist a lesson completion to Lovable Cloud and refresh the local cache.
 * Safe to call from anonymous flows — it no-ops when userId is empty.
 */
export async function upsertLessonProgress({
  userId,
  lessonId,
  score,
  courseId,
  level,
  completed = true,
}: UpsertArgs): Promise<void> {
  // Always refresh the local cache first so the UI updates instantly,
  // even if the network call fails.
  const local = readCourseProgressMap();
  const previous = local[lessonId];
  const nextScore = Math.max(previous?.score ?? 0, score);
  local[lessonId] = {
    score: nextScore,
    completed: completed || !!previous?.completed,
    date: new Date().toISOString(),
  };
  writeCourseProgressMap(local);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LESSON_PROGRESS_EVENT));
  }

  if (!userId) return;

  const now = new Date().toISOString();

  // Read existing row to preserve best_score / completed_at.
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('best_score, completed, completed_at')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const bestScore = Math.max(existing?.best_score ?? 0, score);
  const wasCompleted = !!existing?.completed;
  const completedAt = existing?.completed_at ?? (completed ? now : null);

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId ?? null,
        level: level ?? null,
        score,
        best_score: bestScore,
        completed: completed || wasCompleted,
        completed_at: completedAt,
        last_played_at: now,
      },
      { onConflict: 'user_id,lesson_id' },
    );

  if (error) {
    console.error('[lessonProgressSync] upsert failed', error.message);
  }
}