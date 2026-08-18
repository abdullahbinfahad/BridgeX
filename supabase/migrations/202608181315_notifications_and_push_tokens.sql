CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_at_idx ON public.notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_push_tokens_user_idx ON public.device_push_tokens (user_id) WHERE active;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_read_own_or_admin ON public.notifications;
CREATE POLICY notifications_read_own_or_admin ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_bridgex_admin());
DROP POLICY IF EXISTS notifications_insert_related_or_admin ON public.notifications;
CREATE POLICY notifications_insert_related_or_admin ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  actor_id = auth.uid() AND (
    is_bridgex_admin()
    OR EXISTS (SELECT 1 FROM public.send_requests request WHERE request.id = related_id AND request.user_id = user_id)
    OR EXISTS (SELECT 1 FROM public.carry_listings listing WHERE listing.id = related_id AND listing.user_id = user_id)
    OR EXISTS (
      SELECT 1 FROM public.offers offer
      JOIN public.send_requests request ON request.id = offer.request_id
      WHERE request.id = related_id AND request.user_id = actor_id AND offer.traveler_id = user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.listing_interests interest
      JOIN public.carry_listings listing ON listing.id = interest.listing_id
      WHERE listing.id = related_id AND listing.user_id = actor_id AND interest.sender_id = user_id
    )
  )
);
DROP POLICY IF EXISTS notifications_update_own_or_admin ON public.notifications;
CREATE POLICY notifications_update_own_or_admin ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_bridgex_admin()) WITH CHECK (user_id = auth.uid() OR is_bridgex_admin());

DROP POLICY IF EXISTS device_push_tokens_manage_own ON public.device_push_tokens;
CREATE POLICY device_push_tokens_manage_own ON public.device_push_tokens FOR ALL TO authenticated USING (user_id = auth.uid() OR is_bridgex_admin()) WITH CHECK (user_id = auth.uid() OR is_bridgex_admin());
