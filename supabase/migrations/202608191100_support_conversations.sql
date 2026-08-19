CREATE TABLE IF NOT EXISTS public.contact_enquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES public.contact_enquiries(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_enquiry_messages_enquiry_created_idx
ON public.contact_enquiry_messages(enquiry_id, created_at);

ALTER TABLE public.contact_enquiry_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_enquiry_messages_select_participants ON public.contact_enquiry_messages;
CREATE POLICY contact_enquiry_messages_select_participants
ON public.contact_enquiry_messages
FOR SELECT TO authenticated
USING (
  public.is_bridgex_admin()
  OR EXISTS (
    SELECT 1 FROM public.contact_enquiries enquiry
    WHERE enquiry.id = contact_enquiry_messages.enquiry_id
      AND enquiry.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.send_bridgex_support_message(
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
  v_is_admin boolean := public.is_bridgex_admin();
  v_clean_body text := btrim(p_body);
BEGIN
  IF v_clean_body IS NULL OR char_length(v_clean_body) = 0 THEN
    RAISE EXCEPTION 'A support message is required.';
  END IF;

  SELECT user_id INTO v_recipient_id
  FROM public.contact_enquiries
  WHERE id = p_enquiry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact enquiry not found.';
  END IF;

  IF NOT v_is_admin AND v_recipient_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the original signed-in enquiry member can reply to this support conversation.';
  END IF;

  INSERT INTO public.contact_enquiry_messages (enquiry_id, sender_id, body)
  VALUES (p_enquiry_id, auth.uid(), v_clean_body);

  IF v_is_admin THEN
    IF v_recipient_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
      VALUES (v_recipient_id, auth.uid(), 'contact_reply', 'BridgeX Admin', v_clean_body, '/dashboard/deals?support=' || p_enquiry_id::text, p_enquiry_id);
    END IF;
  ELSE
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    SELECT admin.id, auth.uid(), 'support_member_reply', 'BridgeX member support reply', v_clean_body, '/admin/enquiries', p_enquiry_id
    FROM public.users admin
    WHERE admin.role IN ('admin', 'super_admin');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_bridgex_support_message(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_bridgex_contact_reply(
  p_enquiry_id uuid,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_bridgex_admin() THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  UPDATE public.contact_enquiries
  SET reply_body = btrim(p_body),
      replied_at = now(),
      status = 'resolved',
      resolved_at = now()
  WHERE id = p_enquiry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact enquiry not found.';
  END IF;

  PERFORM public.send_bridgex_support_message(p_enquiry_id, p_body);
END;
$$;
