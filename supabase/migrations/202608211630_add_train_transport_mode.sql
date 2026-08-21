ALTER TABLE public.carry_listings DROP CONSTRAINT IF EXISTS carry_listings_transport_mode_check;
ALTER TABLE public.carry_listings
  ADD CONSTRAINT carry_listings_transport_mode_check
  CHECK (transport_mode IN ('flight', 'train', 'cargo'));
