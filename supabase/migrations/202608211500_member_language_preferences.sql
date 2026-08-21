ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

UPDATE public.users
SET preferred_language = 'en'
WHERE preferred_language IS NULL
   OR preferred_language NOT IN ('en', 'zh-CN', 'fr', 'es', 'de', 'ar', 'ja', 'ko', 'bn', 'hi', 'ur');

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_preferred_language_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_preferred_language_check
  CHECK (preferred_language IN ('en', 'zh-CN', 'fr', 'es', 'de', 'ar', 'ja', 'ko', 'bn', 'hi', 'ur'));

