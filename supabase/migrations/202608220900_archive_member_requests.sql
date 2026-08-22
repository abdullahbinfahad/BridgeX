ALTER TABLE public.send_requests
  ADD COLUMN IF NOT EXISTS member_archived_at timestamptz;

CREATE OR REPLACE FUNCTION public.archive_bridgex_member_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.send_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.send_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the request owner can remove this request from their workspace.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE request_id = p_request_id
      AND NOT (
        coalesce(escrow_status, '') IN ('released', 'refunded')
        OR coalesce(fulfillment_status, '') IN ('released', 'completed', 'cancelled')
      )
  ) THEN
    RAISE EXCEPTION 'This request is part of an active protected order and cannot be removed yet.';
  END IF;

  UPDATE public.send_requests
  SET status = 'closed', member_archived_at = now()
  WHERE id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_bridgex_member_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_bridgex_member_request(uuid) TO authenticated;
