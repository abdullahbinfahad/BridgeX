CREATE OR REPLACE FUNCTION public.mark_bridgex_match_read(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.matches
  SET sender_last_read_at = CASE WHEN sender_id = auth.uid() THEN now() ELSE sender_last_read_at END,
      traveler_last_read_at = CASE WHEN traveler_id = auth.uid() THEN now() ELSE traveler_last_read_at END
  WHERE id = p_match_id
    AND (sender_id = auth.uid() OR traveler_id = auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'You do not belong to this protected match';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_bridgex_match_read(uuid) TO authenticated;
