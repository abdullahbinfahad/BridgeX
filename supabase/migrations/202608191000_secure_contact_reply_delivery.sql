CREATE OR REPLACE FUNCTION public.send_bridgex_contact_reply(
  p_enquiry_id uuid,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id uuid;
  v_clean_body text := btrim(p_body);
BEGIN
  IF NOT public.is_bridgex_admin() THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  IF v_clean_body IS NULL OR char_length(v_clean_body) = 0 THEN
    RAISE EXCEPTION 'A reply message is required.';
  END IF;

  UPDATE public.contact_enquiries
  SET reply_body = v_clean_body,
      replied_at = now(),
      status = 'resolved',
      resolved_at = now()
  WHERE id = p_enquiry_id
  RETURNING user_id INTO v_recipient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact enquiry not found.';
  END IF;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    VALUES (
      v_recipient_id,
      auth.uid(),
      'contact_reply',
      'BridgeX Admin',
      v_clean_body,
      '/dashboard/deals?support=' || p_enquiry_id::text,
      p_enquiry_id
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_bridgex_contact_reply(uuid, text) TO authenticated;
