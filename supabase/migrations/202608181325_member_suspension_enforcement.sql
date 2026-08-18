ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_bridgex_suspended()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT suspended FROM public.users WHERE id = auth.uid()), false);
$$;

DROP POLICY IF EXISTS send_requests_insert_own ON public.send_requests;
CREATE POLICY send_requests_insert_own ON public.send_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND NOT public.is_bridgex_suspended());
DROP POLICY IF EXISTS carry_listings_insert_own ON public.carry_listings;
CREATE POLICY carry_listings_insert_own ON public.carry_listings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND NOT public.is_bridgex_suspended());
DROP POLICY IF EXISTS offers_insert_own ON public.offers;
CREATE POLICY offers_insert_own ON public.offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = traveler_id AND NOT public.is_bridgex_suspended());
DROP POLICY IF EXISTS listing_interests_insert_own ON public.listing_interests;
CREATE POLICY listing_interests_insert_own ON public.listing_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND NOT public.is_bridgex_suspended());
DROP POLICY IF EXISTS verification_insert_own ON public.verification_submissions;
CREATE POLICY verification_insert_own ON public.verification_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT public.is_bridgex_suspended());
DROP POLICY IF EXISTS reports_insert_own ON public.incident_reports;
CREATE POLICY reports_insert_own ON public.incident_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND NOT public.is_bridgex_suspended());
