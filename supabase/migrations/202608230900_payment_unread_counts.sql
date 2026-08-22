CREATE OR REPLACE FUNCTION public.bridgex_native_unread_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updates integer := 0;
  v_messages integer := 0;
  v_workspace integer := 0;
  v_payments integer := 0;
  v_more integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to read account activity.';
  END IF;

  SELECT count(*)::integer INTO v_updates
  FROM public.notifications
  WHERE user_id = v_user_id AND read_at IS NULL;

  SELECT count(*)::integer INTO v_messages
  FROM public.matches
  WHERE (sender_id = v_user_id OR traveler_id = v_user_id)
    AND last_message_at IS NOT NULL
    AND last_message_sender_id IS DISTINCT FROM v_user_id
    AND (
      (sender_id = v_user_id AND (sender_last_read_at IS NULL OR last_message_at > sender_last_read_at))
      OR (traveler_id = v_user_id AND (traveler_last_read_at IS NULL OR last_message_at > traveler_last_read_at))
    );

  SELECT count(*)::integer INTO v_payments
  FROM public.notifications
  WHERE user_id = v_user_id
    AND read_at IS NULL
    AND (
      coalesce(link, '') LIKE '/dashboard/payments%'
      OR coalesce(link, '') LIKE '/dashboard/payouts%'
      OR coalesce(type, '') ~ '(payment|payout)'
    );

  SELECT count(*)::integer INTO v_workspace
  FROM public.notifications
  WHERE user_id = v_user_id
    AND read_at IS NULL
    AND (
      coalesce(link, '') LIKE '/dashboard/offers%'
      OR coalesce(link, '') LIKE '/dashboard/orders%'
      OR coalesce(type, '') ~ '(offer|interest|order|traveler)'
    );

  SELECT count(*)::integer INTO v_more
  FROM public.notifications
  WHERE user_id = v_user_id
    AND read_at IS NULL
    AND (
      coalesce(link, '') LIKE '/dashboard/profile%'
      OR coalesce(link, '') LIKE '/dashboard/verification%'
      OR coalesce(link, '') LIKE '/admin%'
      OR coalesce(type, '') ~ '(verification|account|contact|report|admin|privacy)'
    );

  RETURN jsonb_build_object(
    'updates', v_updates,
    'messages', v_messages,
    'workspace', v_workspace,
    'payments', v_payments,
    'more', v_more
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bridgex_native_unread_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bridgex_native_unread_counts() TO authenticated;
