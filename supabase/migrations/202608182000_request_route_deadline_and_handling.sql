ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS purchase_city text;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS delivery_required_days integer CHECK (delivery_required_days IS NULL OR delivery_required_days BETWEEN 1 AND 365);
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS special_handling text;
