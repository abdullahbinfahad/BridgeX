BEGIN;

DROP POLICY IF EXISTS messages_insert_participant ON public.match_messages;
CREATE POLICY messages_insert_participant ON public.match_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = match_messages.match_id
      AND m.status IN ('active', 'completed', 'disputed')
      AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.send_bridgex_match_message(
  p_match_id uuid,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_body text := btrim(p_body);
  v_message_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in before sending a protected message.';
  END IF;

  IF v_clean_body IS NULL OR char_length(v_clean_body) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'A protected message must contain between 1 and 2,000 characters.';
  END IF;

  PERFORM 1
  FROM public.matches m
  WHERE m.id = p_match_id
    AND m.status IN ('active', 'completed', 'disputed')
    AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This protected conversation is unavailable to your account.';
  END IF;

  INSERT INTO public.match_messages (match_id, sender_id, body)
  VALUES (p_match_id, auth.uid(), v_clean_body)
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_bridgex_match_message(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_bridgex_match_message(uuid, text) TO authenticated;

DROP POLICY IF EXISTS notifications_insert_related_or_admin ON public.notifications;
CREATE POLICY notifications_insert_related_or_admin ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (
    public.is_bridgex_admin()
    OR EXISTS (
      SELECT 1
      FROM public.send_requests r
      WHERE r.id = notifications.related_id
        AND (
          (r.user_id = notifications.user_id AND auth.uid() <> r.user_id)
          OR (
            r.user_id = auth.uid()
            AND EXISTS (
              SELECT 1 FROM public.offers o
              WHERE o.request_id = r.id
                AND o.traveler_id = notifications.user_id
            )
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.carry_listings l
      WHERE l.id = notifications.related_id
        AND (
          (l.user_id = notifications.user_id AND auth.uid() <> l.user_id)
          OR (
            l.user_id = auth.uid()
            AND EXISTS (
              SELECT 1 FROM public.listing_interests i
              WHERE i.listing_id = l.id
                AND i.sender_id = notifications.user_id
            )
          )
        )
    )
  )
);

COMMIT;
