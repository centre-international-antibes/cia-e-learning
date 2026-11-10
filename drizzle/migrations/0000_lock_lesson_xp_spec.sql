DROP POLICY IF EXISTS "lesson_xp_spec readable" ON public.lesson_xp_spec;
REVOKE ALL ON public.lesson_xp_spec FROM anon, authenticated;
GRANT ALL ON public.lesson_xp_spec TO service_role;