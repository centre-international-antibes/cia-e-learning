## Problème

Quand un client termine une leçon (ex: A1 module 1, leçons 1 & 2) :
- ✅ L'XP est bien envoyée au backend via `award_xp` → persistée dans `profiles.total_xp`.
- ❌ La **complétion de la leçon** (score, statut "fait") est sauvegardée uniquement dans `localStorage` (clé `course-progress:<userId>`).

Conséquences :
- Sur un autre appareil / navigateur / après vidage du cache → le parcours apparaît vierge.
- Les composants `LearningPath`, `Curriculum`, `ModuleDrawer`, `ResumeCard`, `useModuleUnlock`, `useRecommendedLessons`, `useLastLessonOpened` lisent tous ce localStorage et affichent "0 leçon faite".
- La table `user_progress` existante n'est pas utilisée car elle attend un `course_id` UUID (référence à `public.courses`), alors que nos leçons sont identifiées par des chaînes (`"lesson-1"`, `"a1-m1-l2"`, etc.) issues du fichier statique `src/data/curriculum.ts`.

## Solution

Persister la complétion de chaque leçon côté serveur (Lovable Cloud) sans aucune limite de temps, et garder le localStorage uniquement comme cache de lecture rapide.

### 1. Nouvelle table `public.lesson_progress`

Une ligne par couple (utilisateur, leçon) :

| colonne | type | rôle |
|---|---|---|
| `user_id` | uuid → `auth.users` | propriétaire |
| `lesson_id` | text | identifiant de leçon (ex `"lesson-1"`) |
| `course_id` | text (nullable) | identifiant du cours/module parent pour filtrage |
| `level` | text (nullable) | `A0…C2` |
| `score` | integer | dernier score (0-100) |
| `best_score` | integer | meilleur score atteint |
| `completed` | boolean | true dès qu'une fois terminée |
| `completed_at` | timestamptz | première complétion |
| `last_played_at` | timestamptz | dernière session |
| `created_at` / `updated_at` | timestamptz | standards |

- Clé primaire composite `(user_id, lesson_id)` → un upsert par leçon.
- RLS : chaque utilisateur ne voit/écrit que ses propres lignes ; admins lisent tout via `has_role`.
- GRANTs pour `authenticated` + `service_role`.
- Trigger `updated_at`.

### 2. Hook `useLessonProgress`

Nouveau hook React qui :
- Au login, charge en une requête toutes les lignes de l'utilisateur dans un `Map<lessonId, entry>`.
- Hydrate le `localStorage` (`course-progress:<userId>`) avec ces données → tous les composants existants continuent de fonctionner sans modification.
- Expose `markLessonCompleted(lessonId, { score, courseId, level })` qui :
  1. Upsert la ligne dans `lesson_progress` (Lovable Cloud).
  2. Met à jour le localStorage (cache).
  3. Émet un évènement `lesson-progress-update` pour rafraîchir `LearningPath`/`Curriculum`/`ResumeCard`.
- Écoute `auth state change` → re-sync au login, vide le cache au logout.

### 3. Intégration dans le flux de complétion

Un seul point d'entrée : la callback `onComplete` du `CoursePlayer` (déclenchée dans `CourseDetail.tsx` ligne ~114).
- Avant : écrit dans `localStorage` puis `addXP`.
- Après : appelle `markLessonCompleted(...)` (qui fait DB + cache) puis `addXP` (déjà serveur).

### 4. Synchronisation initiale

Dans `useAuth.tsx`, après `setActiveProgressUser(user.id)`, déclencher la synchro `lesson_progress → localStorage` afin que la page Parcours affichée immédiatement après login soit à jour.

### 5. Hors périmètre

- Pas de modification de la table `user_progress` existante (gardée pour un futur lien avec `courses` UUID si besoin).
- Pas de changement visuel : seul le pipeline de stockage change.
- Pas de migration des données localStorage existantes vers la DB (la prochaine complétion repeuplera).

### Détails techniques

```sql
CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  course_id text,
  level text,
  score integer NOT NULL DEFAULT 0,
  best_score integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_played_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read all" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_user_course ON public.lesson_progress(user_id, course_id);
```

### Fichiers touchés

- **Nouveau** : migration SQL, `src/hooks/useLessonProgress.ts`
- **Modifié** : `src/lib/courseProgress.ts` (helper de sync DB ↔ cache), `src/pages/CourseDetail.tsx` (appel `markLessonCompleted`), `src/hooks/useAuth.tsx` (sync au login).
- **Inchangés** : tous les consommateurs (`LearningPath`, `Curriculum`, `ModuleDrawer`, `ResumeCard`, `useModuleUnlock`, etc.) car ils continuent de lire le localStorage hydraté.

### Vérification

1. Se connecter, terminer une leçon → ligne créée dans `lesson_progress`.
2. Se déconnecter / se reconnecter dans un autre navigateur → la leçon apparaît bien comme faite dans `/parcours/A1` et le module 1 progresse.
3. Vider le localStorage → après reload, le parcours reste correct (hydraté depuis la DB).
