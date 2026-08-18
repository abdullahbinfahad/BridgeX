ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT ARRAY[]::text[];
UPDATE public.send_requests SET categories = ARRAY[category] WHERE array_length(categories, 1) IS NULL OR array_length(categories, 1) = 0;
