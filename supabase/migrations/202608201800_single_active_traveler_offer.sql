UPDATE public.offers AS competing
SET status = 'rejected', updated_at = now()
WHERE competing.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.offers AS selected
    WHERE selected.request_id = competing.request_id
      AND selected.id <> competing.id
      AND selected.status IN ('pending_payment', 'payment_verifying', 'accepted')
  );

CREATE UNIQUE INDEX IF NOT EXISTS offers_one_active_traveler_per_request
ON public.offers (request_id)
WHERE status IN ('pending_payment', 'payment_verifying', 'accepted');
