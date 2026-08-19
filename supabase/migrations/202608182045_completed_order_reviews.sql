CREATE TABLE IF NOT EXISTS public.completed_order_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewed_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR char_length(trim(comment)) BETWEEN 2 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, reviewer_id),
  CHECK(reviewer_id <> reviewed_user_id)
);
ALTER TABLE public.completed_order_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY completed_reviews_public_read ON public.completed_order_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY completed_reviews_participant_insert ON public.completed_order_reviews FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.fulfillment_status = 'released' AND (o.sender_id = auth.uid() OR o.traveler_id = auth.uid()) AND reviewed_user_id = CASE WHEN o.sender_id = auth.uid() THEN o.traveler_id ELSE o.sender_id END));
CREATE VIEW public.bridgex_member_rating_summaries WITH (security_invoker = false) AS SELECT reviewed_user_id AS id, round(avg(rating)::numeric, 1) AS average_rating, count(*)::integer AS review_count FROM public.completed_order_reviews GROUP BY reviewed_user_id;
GRANT SELECT ON public.bridgex_member_rating_summaries TO anon, authenticated;
