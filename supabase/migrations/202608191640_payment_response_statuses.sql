ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_status_check;
ALTER TABLE public.offers ADD CONSTRAINT offers_status_check
  CHECK (status IN ('pending', 'pending_payment', 'payment_verifying', 'accepted', 'rejected', 'withdrawn'));

ALTER TABLE public.listing_interests DROP CONSTRAINT IF EXISTS listing_interests_status_check;
ALTER TABLE public.listing_interests ADD CONSTRAINT listing_interests_status_check
  CHECK (status IN ('pending', 'pending_payment', 'payment_verifying', 'accepted', 'rejected', 'withdrawn'));
