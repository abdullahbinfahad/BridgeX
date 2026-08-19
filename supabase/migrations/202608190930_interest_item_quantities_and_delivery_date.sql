ALTER TABLE public.listing_interests
  ADD COLUMN IF NOT EXISTS item_quantities jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery_required_by date;

CREATE INDEX IF NOT EXISTS listing_interests_delivery_required_by_idx
  ON public.listing_interests (delivery_required_by)
  WHERE delivery_required_by IS NOT NULL;
