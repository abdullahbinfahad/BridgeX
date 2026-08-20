-- Keep review eligibility aligned with the order states exposed by the completed-order screen.
DROP POLICY IF EXISTS completed_reviews_participant_insert ON public.completed_order_reviews;

CREATE POLICY completed_reviews_participant_insert
ON public.completed_order_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  reviewer_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.id = order_id
      AND (o.sender_id = auth.uid() OR o.traveler_id = auth.uid())
      AND (
        o.fulfillment_status IN ('released', 'completed')
        OR o.escrow_status = 'released'
      )
      AND reviewed_user_id = CASE
        WHEN o.sender_id = auth.uid() THEN o.traveler_id
        ELSE o.sender_id
      END
  )
);
