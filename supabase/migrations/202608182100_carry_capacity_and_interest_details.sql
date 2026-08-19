ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS accepted_categories text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS airline_name text;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS flight_number text;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS cargo_provider text;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS cargo_reference text;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS quantity_description text;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS total_offer_bdt numeric;
