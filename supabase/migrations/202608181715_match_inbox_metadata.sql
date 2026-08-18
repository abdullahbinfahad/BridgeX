ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS traveler_name text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS sender_last_read_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS traveler_last_read_at timestamptz;

UPDATE public.matches m SET sender_name = u.full_name FROM public.users u WHERE m.sender_id = u.id AND m.sender_name IS NULL;
UPDATE public.matches m SET traveler_name = u.full_name FROM public.users u WHERE m.traveler_id = u.id AND m.traveler_name IS NULL;

CREATE OR REPLACE FUNCTION public.bridgex_snapshot_match_names()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT full_name INTO NEW.sender_name FROM public.users WHERE id = NEW.sender_id;
  SELECT full_name INTO NEW.traveler_name FROM public.users WHERE id = NEW.traveler_id;
  NEW.sender_last_read_at := COALESCE(NEW.sender_last_read_at, now());
  NEW.traveler_last_read_at := COALESCE(NEW.traveler_last_read_at, now());
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bridgex_snapshot_match_names_before_insert ON public.matches;
CREATE TRIGGER bridgex_snapshot_match_names_before_insert BEFORE INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.bridgex_snapshot_match_names();

CREATE OR REPLACE FUNCTION public.mark_bridgex_match_read(p_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.matches SET sender_last_read_at = now() WHERE id = p_match_id AND sender_id = auth.uid();
  UPDATE public.matches SET traveler_last_read_at = now() WHERE id = p_match_id AND traveler_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'You do not belong to this protected match'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_bridgex_match_read(uuid) TO authenticated;
