ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS last_message_body text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS last_message_sender_id uuid;

UPDATE public.matches m
SET last_message_body = latest.body,
    last_message_at = latest.created_at,
    last_message_sender_id = latest.sender_id
FROM (
  SELECT DISTINCT ON (match_id) match_id, body, created_at, sender_id
  FROM public.match_messages
  ORDER BY match_id, created_at DESC
) latest
WHERE latest.match_id = m.id AND m.last_message_at IS NULL;

CREATE OR REPLACE FUNCTION public.bridgex_snapshot_match_last_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.matches
  SET last_message_body = NEW.body, last_message_at = NEW.created_at, last_message_sender_id = NEW.sender_id
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bridgex_snapshot_match_last_message_after_insert ON public.match_messages;
CREATE TRIGGER bridgex_snapshot_match_last_message_after_insert AFTER INSERT ON public.match_messages FOR EACH ROW EXECUTE FUNCTION public.bridgex_snapshot_match_last_message();
