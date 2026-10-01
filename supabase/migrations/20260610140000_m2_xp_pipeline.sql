-- ════════════════════════════════════════════════════════════════════════
-- M2 — Pipeline XP serveur
--
-- Décisions actées :
--   1. Le serveur est la seule source d'XP. Le client n'envoie jamais de
--      montant, seulement des résultats (bonnes réponses, meilleure série).
--   2. Barème d'une leçon (~110 XP) :
--        complétion ................. 50
--        par bonne réponse .......... +5
--        meilleure série ≥ 5 ........ +5    (non cumulatif)
--        meilleure série ≥ 10 ....... +10   (remplace le palier ci-dessus)
--        leçon parfaite ............. +20   (si la leçon a au moins 1 question)
--   3. Le rejeu rapporte 100 % du barème, avec deux garde-fous :
--        - durée serveur ≥ 3 s × nombre d'étapes          → sinon `too_fast`
--        - 3 complétions récompensées max / leçon / 24 h  → sinon `replay_cap`
--      Dans les deux cas : leçon marquée terminée, 0 XP, raison renvoyée.
--   4. L'XP déjà acquise est conservée — aucune migration de données.
--   5. Le niveau CECR est découplé de l'XP : il ne bouge plus que par la
--      progression pédagogique (`set_cecr_level`) ou le test de placement.
--      `award_xp` ne touche plus `cecr_level`.
--
-- Conséquence de sécurité : `award_xp` n'est plus exécutable par le rôle
-- `authenticated`. Elle reste appelée par les fonctions SECURITY DEFINER
-- qui, elles, décident du montant (voir la liste des appelants en bas).
-- ════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- a. Référentiel des leçons
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_xp_spec (
  course_id      TEXT PRIMARY KEY,
  step_count     INTEGER NOT NULL CHECK (step_count > 0),
  question_count INTEGER NOT NULL CHECK (question_count >= 0),
  level          TEXT
);

ALTER TABLE public.lesson_xp_spec ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_xp_spec readable" ON public.lesson_xp_spec;
CREATE POLICY "lesson_xp_spec readable"
  ON public.lesson_xp_spec FOR SELECT TO authenticated USING (true);
-- Aucune policy d'écriture : le seed est appliqué par migration uniquement.

-- >>> lesson_xp_spec seed (généré — ne pas éditer à la main)
-- Régénérer : npm run gen:lesson-xp-spec -- --write
INSERT INTO public.lesson_xp_spec (course_id, step_count, question_count, level) VALUES
  ('1', 8, 7, NULL),
  ('10', 8, 6, NULL),
  ('2', 7, 5, NULL),
  ('3', 7, 5, NULL),
  ('4', 8, 7, NULL),
  ('5', 7, 6, NULL),
  ('6', 7, 5, NULL),
  ('7', 7, 6, NULL),
  ('8', 8, 5, NULL),
  ('9', 8, 7, NULL),
  ('lesson-1', 9, 7, 'A1'),
  ('lesson-10', 2, 1, 'A1'),
  ('lesson-100', 8, 7, 'A2'),
  ('lesson-101', 8, 6, 'B1'),
  ('lesson-102', 8, 6, 'B1'),
  ('lesson-103', 8, 6, 'B1'),
  ('lesson-104', 8, 6, 'B1'),
  ('lesson-105', 8, 6, 'B1'),
  ('lesson-106', 8, 6, 'B1'),
  ('lesson-107', 8, 6, 'B1'),
  ('lesson-108', 8, 6, 'B1'),
  ('lesson-109', 8, 7, 'B1'),
  ('lesson-11', 8, 6, 'A1'),
  ('lesson-110', 8, 7, 'B1'),
  ('lesson-111', 8, 6, 'B1'),
  ('lesson-112', 8, 6, 'B1'),
  ('lesson-113', 8, 6, 'B1'),
  ('lesson-114', 8, 6, 'B1'),
  ('lesson-115', 8, 6, 'B1'),
  ('lesson-116', 8, 6, 'B1'),
  ('lesson-117', 8, 6, 'B1'),
  ('lesson-118', 8, 6, 'B1'),
  ('lesson-119', 8, 7, 'B1'),
  ('lesson-12', 7, 5, 'A1'),
  ('lesson-120', 8, 7, 'B1'),
  ('lesson-121', 8, 6, 'B1'),
  ('lesson-122', 8, 6, 'B1'),
  ('lesson-123', 8, 6, 'B1'),
  ('lesson-124', 8, 6, 'B1'),
  ('lesson-125', 8, 6, 'B1'),
  ('lesson-126', 8, 6, 'B1'),
  ('lesson-127', 8, 6, 'B1'),
  ('lesson-128', 8, 6, 'B1'),
  ('lesson-129', 8, 7, 'B1'),
  ('lesson-13', 7, 5, 'A1'),
  ('lesson-130', 8, 7, 'B1'),
  ('lesson-131', 8, 6, 'B1'),
  ('lesson-132', 8, 6, 'B1'),
  ('lesson-133', 8, 6, 'B1'),
  ('lesson-134', 8, 6, 'B1'),
  ('lesson-135', 8, 6, 'B1'),
  ('lesson-136', 8, 6, 'B1'),
  ('lesson-137', 8, 6, 'B1'),
  ('lesson-138', 8, 6, 'B1'),
  ('lesson-139', 8, 7, 'B1'),
  ('lesson-14', 7, 5, 'A1'),
  ('lesson-140', 8, 7, 'B1'),
  ('lesson-141', 8, 6, 'B1'),
  ('lesson-142', 8, 6, 'B1'),
  ('lesson-143', 8, 6, 'B1'),
  ('lesson-144', 8, 6, 'B1'),
  ('lesson-145', 8, 6, 'B1'),
  ('lesson-146', 8, 6, 'B1'),
  ('lesson-147', 8, 6, 'B1'),
  ('lesson-148', 8, 7, 'B1'),
  ('lesson-149', 8, 7, 'B1'),
  ('lesson-15', 7, 5, 'A1'),
  ('lesson-150', 8, 7, 'B1'),
  ('lesson-151', 8, 6, 'B2'),
  ('lesson-152', 8, 6, 'B2'),
  ('lesson-153', 8, 6, 'B2'),
  ('lesson-154', 8, 6, 'B2'),
  ('lesson-155', 8, 6, 'B2'),
  ('lesson-156', 8, 6, 'B2'),
  ('lesson-157', 8, 6, 'B2'),
  ('lesson-158', 8, 6, 'B2'),
  ('lesson-159', 8, 7, 'B2'),
  ('lesson-16', 7, 5, 'A1'),
  ('lesson-160', 2, 1, 'B2'),
  ('lesson-161', 8, 6, 'B2'),
  ('lesson-162', 8, 6, 'B2'),
  ('lesson-163', 8, 6, 'B2'),
  ('lesson-164', 8, 6, 'B2'),
  ('lesson-165', 8, 6, 'B2'),
  ('lesson-166', 8, 6, 'B2'),
  ('lesson-167', 8, 6, 'B2'),
  ('lesson-168', 8, 6, 'B2'),
  ('lesson-169', 8, 7, 'B2'),
  ('lesson-17', 7, 5, 'A1'),
  ('lesson-170', 2, 1, 'B2'),
  ('lesson-171', 8, 6, 'B2'),
  ('lesson-172', 8, 6, 'B2'),
  ('lesson-173', 8, 6, 'B2'),
  ('lesson-174', 8, 6, 'B2'),
  ('lesson-175', 8, 6, 'B2'),
  ('lesson-176', 8, 6, 'B2'),
  ('lesson-177', 8, 6, 'B2'),
  ('lesson-178', 8, 6, 'B2'),
  ('lesson-179', 8, 7, 'B2'),
  ('lesson-18', 7, 5, 'A1'),
  ('lesson-180', 2, 1, 'B2'),
  ('lesson-181', 8, 6, 'B2'),
  ('lesson-182', 8, 6, 'B2'),
  ('lesson-183', 8, 6, 'B2'),
  ('lesson-184', 8, 6, 'B2'),
  ('lesson-185', 8, 6, 'B2'),
  ('lesson-186', 8, 6, 'B2'),
  ('lesson-187', 8, 6, 'B2'),
  ('lesson-188', 8, 6, 'B2'),
  ('lesson-189', 8, 7, 'B2'),
  ('lesson-19', 7, 6, 'A1'),
  ('lesson-190', 2, 1, 'B2'),
  ('lesson-191', 8, 6, 'B2'),
  ('lesson-192', 8, 6, 'B2'),
  ('lesson-193', 8, 6, 'B2'),
  ('lesson-194', 8, 6, 'B2'),
  ('lesson-195', 8, 6, 'B2'),
  ('lesson-196', 8, 6, 'B2'),
  ('lesson-197', 8, 6, 'B2'),
  ('lesson-198', 7, 5, 'B2'),
  ('lesson-199', 2, 1, 'B2'),
  ('lesson-2', 8, 6, 'A1'),
  ('lesson-20', 2, 1, 'A1'),
  ('lesson-200', 2, 1, 'B2'),
  ('lesson-3', 7, 5, 'A1'),
  ('lesson-4', 7, 6, 'A1'),
  ('lesson-5', 7, 5, 'A1'),
  ('lesson-51', 8, 6, 'A2'),
  ('lesson-52', 8, 6, 'A2'),
  ('lesson-53', 8, 6, 'A2'),
  ('lesson-54', 8, 6, 'A2'),
  ('lesson-55', 8, 6, 'A2'),
  ('lesson-56', 8, 6, 'A2'),
  ('lesson-57', 8, 6, 'A2'),
  ('lesson-58', 8, 6, 'A2'),
  ('lesson-59', 8, 7, 'A2'),
  ('lesson-6', 6, 4, 'A1'),
  ('lesson-60', 8, 7, 'A2'),
  ('lesson-61', 8, 6, 'A2'),
  ('lesson-62', 8, 6, 'A2'),
  ('lesson-63', 8, 6, 'A2'),
  ('lesson-64', 8, 6, 'A2'),
  ('lesson-65', 8, 6, 'A2'),
  ('lesson-66', 8, 6, 'A2'),
  ('lesson-67', 8, 6, 'A2'),
  ('lesson-68', 8, 6, 'A2'),
  ('lesson-69', 8, 7, 'A2'),
  ('lesson-7', 6, 4, 'A1'),
  ('lesson-70', 8, 7, 'A2'),
  ('lesson-71', 8, 6, 'A2'),
  ('lesson-72', 8, 6, 'A2'),
  ('lesson-73', 8, 6, 'A2'),
  ('lesson-74', 8, 6, 'A2'),
  ('lesson-75', 8, 6, 'A2'),
  ('lesson-76', 8, 6, 'A2'),
  ('lesson-77', 8, 6, 'A2'),
  ('lesson-78', 8, 6, 'A2'),
  ('lesson-79', 8, 7, 'A2'),
  ('lesson-8', 7, 5, 'A1'),
  ('lesson-80', 8, 7, 'A2'),
  ('lesson-81', 8, 6, 'A2'),
  ('lesson-82', 8, 6, 'A2'),
  ('lesson-83', 8, 6, 'A2'),
  ('lesson-84', 8, 6, 'A2'),
  ('lesson-85', 8, 6, 'A2'),
  ('lesson-86', 8, 6, 'A2'),
  ('lesson-87', 8, 6, 'A2'),
  ('lesson-88', 8, 6, 'A2'),
  ('lesson-89', 8, 7, 'A2'),
  ('lesson-9', 6, 5, 'A1'),
  ('lesson-90', 8, 7, 'A2'),
  ('lesson-91', 8, 6, 'A2'),
  ('lesson-92', 8, 6, 'A2'),
  ('lesson-93', 8, 6, 'A2'),
  ('lesson-94', 8, 6, 'A2'),
  ('lesson-95', 8, 6, 'A2'),
  ('lesson-96', 8, 6, 'A2'),
  ('lesson-97', 8, 6, 'A2'),
  ('lesson-98', 8, 7, 'A2'),
  ('lesson-99', 8, 7, 'A2')
ON CONFLICT (course_id) DO UPDATE
  SET step_count = EXCLUDED.step_count,
      question_count = EXCLUDED.question_count,
      level = EXCLUDED.level;
-- <<< lesson_xp_spec seed

-- ─────────────────────────────────────────────────────────────────────
-- b. Tentatives de leçon
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    TEXT NOT NULL REFERENCES public.lesson_xp_spec(course_id),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  xp_awarded   INTEGER,
  outcome      TEXT CHECK (outcome IN ('rewarded', 'too_fast', 'replay_cap'))
);

CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_course
  ON public.lesson_attempts (user_id, course_id, completed_at);

ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_attempts own rows" ON public.lesson_attempts;
CREATE POLICY "lesson_attempts own rows"
  ON public.lesson_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Aucune policy INSERT/UPDATE/DELETE : seules les fonctions ci-dessous écrivent.

-- ─────────────────────────────────────────────────────────────────────
-- c. Ouverture d'une tentative
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_lesson(_course_id TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _id  UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  PERFORM 1 FROM public.lesson_xp_spec WHERE course_id = _course_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown_course'; END IF;

  -- Reprise de leçon : on réutilise une tentative ouverte de moins de 6 h
  -- plutôt que d'en créer une seconde, sinon quitter puis revenir remettrait
  -- le chronomètre `too_fast` à zéro.
  SELECT id INTO _id FROM public.lesson_attempts
   WHERE user_id = _uid
     AND course_id = _course_id
     AND completed_at IS NULL
     AND started_at > now() - INTERVAL '6 hours'
   ORDER BY started_at DESC
   LIMIT 1;
  IF _id IS NOT NULL THEN RETURN _id; END IF;

  INSERT INTO public.lesson_attempts (user_id, course_id)
    VALUES (_uid, _course_id)
    RETURNING id INTO _id;
  RETURN _id;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- d. Clôture d'une tentative — calcul du barème côté serveur
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_lesson(
  _attempt_id UUID,
  _correct    INTEGER,
  _best_combo INTEGER
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid             UUID := auth.uid();
  _attempt         public.lesson_attempts%ROWTYPE;
  _spec            public.lesson_xp_spec%ROWTYPE;
  _xp_base         CONSTANT INTEGER := 50;
  _xp_per_correct  CONSTANT INTEGER := 5;
  _xp_perfect      CONSTANT INTEGER := 20;
  _base            INTEGER := 0;
  _correct_xp      INTEGER := 0;
  _combo_xp        INTEGER := 0;
  _perfect_xp      INTEGER := 0;
  _total           INTEGER := 0;
  _outcome         TEXT;
  _rewarded_recent INTEGER;
  _is_replay       BOOLEAN;
  _award           JSONB;
  _xp_after        INTEGER;
  _weekly_after    INTEGER;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  -- Idempotence : une tentative ne se clôt qu'une fois. Rejouer le même
  -- attempt_id (double clic, retry réseau) ne crédite rien.
  SELECT * INTO _attempt FROM public.lesson_attempts
   WHERE id = _attempt_id AND user_id = _uid
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'attempt_invalid'; END IF;
  IF _attempt.completed_at IS NOT NULL THEN RAISE EXCEPTION 'attempt_invalid'; END IF;

  SELECT * INTO _spec FROM public.lesson_xp_spec WHERE course_id = _attempt.course_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'spec_missing'; END IF;

  -- Le client ne décide pas de l'XP, mais ses résultats doivent rester
  -- cohérents avec le contenu réel de la leçon.
  IF _correct IS NULL OR _best_combo IS NULL THEN RAISE EXCEPTION 'invalid_result'; END IF;
  IF _correct < 0 OR _correct > _spec.question_count THEN RAISE EXCEPTION 'invalid_result'; END IF;
  IF _best_combo < 0 OR _best_combo > _correct THEN RAISE EXCEPTION 'invalid_result'; END IF;

  _is_replay := EXISTS (
    SELECT 1 FROM public.lesson_attempts
     WHERE user_id = _uid AND course_id = _attempt.course_id
       AND id <> _attempt.id AND outcome = 'rewarded'
  );

  SELECT count(*) INTO _rewarded_recent FROM public.lesson_attempts
   WHERE user_id = _uid AND course_id = _attempt.course_id
     AND xp_awarded > 0
     AND completed_at > now() - INTERVAL '24 hours';

  IF now() - _attempt.started_at < make_interval(secs => _spec.step_count * 3) THEN
    _outcome := 'too_fast';
  ELSIF _rewarded_recent >= 3 THEN
    _outcome := 'replay_cap';
  ELSE
    _outcome    := 'rewarded';
    _base       := _xp_base;
    _correct_xp := _correct * _xp_per_correct;
    _combo_xp   := CASE WHEN _best_combo >= 10 THEN 10
                        WHEN _best_combo >= 5  THEN 5
                        ELSE 0 END;
    _perfect_xp := CASE WHEN _spec.question_count > 0 AND _correct = _spec.question_count
                        THEN _xp_perfect ELSE 0 END;
    _total      := _base + _correct_xp + _combo_xp + _perfect_xp;
  END IF;

  -- La tentative est close dans tous les cas : la leçon est terminée même
  -- quand elle ne rapporte rien.
  UPDATE public.lesson_attempts
     SET completed_at = now(), xp_awarded = _total, outcome = _outcome
   WHERE id = _attempt.id;

  IF _outcome = 'rewarded' THEN
    _award := public.award_xp(_total, 'lesson', _attempt.id::text);
    _xp_after := (_award->>'xp_after')::INTEGER;
  ELSE
    SELECT total_xp INTO _xp_after FROM public.profiles WHERE user_id = _uid;
  END IF;
  SELECT weekly_xp INTO _weekly_after FROM public.profiles WHERE user_id = _uid;

  RETURN jsonb_build_object(
    'outcome', _outcome,
    'breakdown', jsonb_build_object(
      'base', _base, 'correct', _correct_xp, 'combo', _combo_xp, 'perfect', _perfect_xp
    ),
    'xp_awarded', _total,
    'xp_after', COALESCE(_xp_after, 0),
    'weekly_xp_after', COALESCE(_weekly_after, 0),
    'is_replay', _is_replay
  );
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- e. Speed test — barème et record côté serveur
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.speed_test_best (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level      TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, level)
);

ALTER TABLE public.speed_test_best ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "speed_test_best own rows" ON public.speed_test_best;
CREATE POLICY "speed_test_best own rows"
  ON public.speed_test_best FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.complete_speed_test(_level TEXT, _score INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid          UUID := auth.uid();
  _levels       CONSTANT TEXT[] := ARRAY['A0','A1','A2','B1','B2','C1','C2'];
  _max_score    CONSTANT INTEGER := 60;   -- plafond de questions d'une session
  _xp_per_point CONSTANT INTEGER := 10;
  _record_bonus CONSTANT INTEGER := 50;
  _runs_24h     INTEGER;
  _previous     INTEGER;
  _effective    INTEGER;
  _is_record    BOOLEAN := false;
  _xp           INTEGER := 0;
  _outcome      TEXT;
  _award        JSONB;
  _xp_after     INTEGER;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _level IS NULL OR NOT (_level = ANY(_levels)) THEN RAISE EXCEPTION 'invalid_level'; END IF;
  IF _score IS NULL OR _score < 0 THEN RAISE EXCEPTION 'invalid_result'; END IF;

  _effective := LEAST(_score, _max_score);

  SELECT best_score INTO _previous FROM public.speed_test_best
   WHERE user_id = _uid AND level = _level;
  _previous := COALESCE(_previous, 0);

  -- Les runs récompensés sont tracés par l'audit XP : une entrée par run
  -- crédité, source `speed_test`, référence = niveau joué.
  SELECT count(*) INTO _runs_24h FROM public.xp_audit_log
   WHERE user_id = _uid AND source = 'speed_test' AND source_ref = _level
     AND created_at > now() - INTERVAL '24 hours';

  IF _runs_24h >= 5 THEN
    _outcome := 'replay_cap';
  ELSE
    _outcome   := 'rewarded';
    _is_record := _effective > _previous;
    _xp        := _effective * _xp_per_point + CASE WHEN _is_record THEN _record_bonus ELSE 0 END;
  END IF;

  -- Le record est enregistré même quand le run ne rapporte plus d'XP :
  -- c'est une performance, pas une récompense.
  IF _effective > _previous THEN
    INSERT INTO public.speed_test_best (user_id, level, best_score, updated_at)
      VALUES (_uid, _level, _effective, now())
    ON CONFLICT (user_id, level) DO UPDATE
      SET best_score = EXCLUDED.best_score, updated_at = now();
    _previous := _effective;
  END IF;

  IF _outcome = 'rewarded' AND _xp > 0 THEN
    _award := public.award_xp(_xp, 'speed_test', _level);
    _xp_after := (_award->>'xp_after')::INTEGER;
  ELSE
    SELECT total_xp INTO _xp_after FROM public.profiles WHERE user_id = _uid;
  END IF;

  RETURN jsonb_build_object(
    'outcome', _outcome,
    'xp_awarded', CASE WHEN _outcome = 'rewarded' THEN _xp ELSE 0 END,
    'is_record', _is_record,
    'best_score', _previous,
    'xp_after', COALESCE(_xp_after, 0)
  );
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- f. `award_xp` : plus de niveau CECR, plus d'appel client
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_xp(_amount INTEGER, _source TEXT, _source_ref TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _xp_before INTEGER; _xp_after INTEGER;
  _monday DATE := public.current_week_monday();
  _current_period DATE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  -- Plafond par appel. Il ne protège plus d'un montant choisi par le client
  -- (celui-ci n'appelle plus cette fonction) mais d'un barème serveur qui
  -- déraperait. Le maximum légitime est 650 : speed test parfait, 60 × 10 + 50
  -- de record. L'ancienne valeur de 500 rejetait ce cas pourtant normal.
  IF _amount > 700 THEN RAISE EXCEPTION 'Dépasse le plafond par appel (700)'; END IF;
  IF _source IS NULL OR length(_source) = 0 OR length(_source) > 50 THEN
    RAISE EXCEPTION 'Source invalide'; END IF;

  SELECT total_xp INTO _xp_before FROM public.profiles WHERE user_id = _uid;
  IF _xp_before IS NULL THEN _xp_before := 0; END IF;
  _xp_after := _xp_before + _amount;

  PERFORM set_config('app.bypass_xp_protection', 'true', true);
  -- `cecr_level` n'est volontairement plus touché ici : le niveau suit la
  -- progression pédagogique, pas le compteur d'XP (décision 5).
  UPDATE public.profiles SET total_xp = _xp_after WHERE user_id = _uid;

  SELECT weekly_period_start INTO _current_period FROM public.profiles WHERE user_id = _uid;
  IF _current_period IS NULL OR _current_period < _monday THEN
    UPDATE public.profiles SET weekly_xp = _amount, weekly_period_start = _monday WHERE user_id = _uid;
  ELSE
    UPDATE public.profiles SET weekly_xp = weekly_xp + _amount WHERE user_id = _uid;
  END IF;

  INSERT INTO public.xp_audit_log (user_id, amount, source, source_ref, xp_before, xp_after)
    VALUES (_uid, _amount, _source, _source_ref, _xp_before, _xp_after);

  RETURN jsonb_build_object('xp_before', _xp_before, 'xp_after', _xp_after);
END $$;

-- `mark_daily_done` renvoyait `leveled_up` / `level_after` dérivés de l'XP.
-- Le niveau ne bougeant plus avec l'XP, on renvoie le niveau courant tel quel
-- (le client s'en sert pour rafraîchir son compteur) et on retire `leveled_up`.
CREATE OR REPLACE FUNCTION public.mark_daily_done()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  _last_done DATE; _current_streak INTEGER; _new_streak INTEGER;
  _streak_bonus CONSTANT INTEGER := 25;
  _award_result JSONB;
  _level TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT last_daily_completed_at, daily_streak, cecr_level
    INTO _last_done, _current_streak, _level
    FROM public.profiles WHERE user_id = _uid;
  IF _current_streak IS NULL THEN _current_streak := 0; END IF;
  IF _last_done = _today THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'already_done_today', 'streak', _current_streak);
  END IF;
  IF _last_done = _today - INTERVAL '1 day' THEN
    _new_streak := _current_streak + 1;
  ELSE
    _new_streak := 1;
  END IF;
  PERFORM set_config('app.bypass_xp_protection', 'true', true);
  UPDATE public.profiles SET daily_streak = _new_streak, last_daily_completed_at = _today
    WHERE user_id = _uid;
  _award_result := public.award_xp(_streak_bonus, 'daily_challenge', _today::text);
  RETURN jsonb_build_object(
    'awarded', true, 'xp_awarded', _streak_bonus, 'streak', _new_streak,
    'total_xp_after', (_award_result->>'xp_after')::integer,
    'level_after', COALESCE(_level, 'A1')
  );
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- g. Droits
-- ─────────────────────────────────────────────────────────────────────
-- `award_xp` n'est plus appelable depuis le client : seules les fonctions
-- SECURITY DEFINER ci-dessous décident d'un montant.
-- Appelants en base au moment de cette migration :
--   public.mark_daily_done()        — bonus de série quotidienne (25 XP)
--   public.complete_lesson(...)     — barème de leçon
--   public.complete_speed_test(...) — barème du speed test
--   public.complete_onboarding()    — bonus de bienvenue
REVOKE EXECUTE ON FUNCTION public.award_xp(INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.start_lesson(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_lesson(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_speed_test(TEXT, INTEGER) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.start_lesson(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_lesson(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_speed_test(TEXT, INTEGER) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- Script de vérification manuelle (à exécuter dans le SQL editor Supabase,
-- connecté en tant qu'utilisateur de test — décommenter pour s'en servir).
--
--   -- 1. rewarded : leçon parfaite 8 questions, combo 8 → 115 XP
--   select public.start_lesson('lesson-1') as attempt \gset
--   -- attendre step_count × 3 s
--   select public.complete_lesson(:'attempt', 8, 8);
--   -- → outcome=rewarded, breakdown={base:50,correct:40,combo:5,perfect:20}
--
--   -- 2. attempt rejoué : même id une seconde fois
--   select public.complete_lesson(:'attempt', 8, 8);
--   -- → ERROR: attempt_invalid, aucune XP
--
--   -- 3. too_fast : clôture immédiate
--   select public.start_lesson('lesson-2') as fast \gset
--   select public.complete_lesson(:'fast', 5, 3);
--   -- → outcome=too_fast, xp_awarded=0, tentative close
--
--   -- 4. replay_cap : 4ᵉ complétion récompensée en 24 h
--   --    (répéter 3 fois le cas 1 sur la même leçon, puis une 4ᵉ)
--   -- → outcome=replay_cap, xp_awarded=0
--
--   -- 5. correct > question_count
--   select public.start_lesson('lesson-3') as bad \gset
--   select public.complete_lesson(:'bad', 999, 0);
--   -- → ERROR: invalid_result
--
--   -- 6. verrouillage de award_xp (doit renvoyer false)
--   select has_function_privilege('authenticated',
--     'public.award_xp(integer,text,text)', 'execute');
-- ════════════════════════════════════════════════════════════════════════
