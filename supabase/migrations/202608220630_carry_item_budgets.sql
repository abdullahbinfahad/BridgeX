-- Optional traveller-defined per-item budgets for quantity-aware carry capacity.
-- Keep this separate from accepted_item_quantities, which remains a numeric inventory
-- map consumed by the live-capacity trigger.
ALTER TABLE public.carry_listings
  ADD COLUMN IF NOT EXISTS accepted_item_budgets jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.carry_listings.accepted_item_budgets IS
  'Optional currency-denominated preferred price per selected item category, keyed by category name.';
