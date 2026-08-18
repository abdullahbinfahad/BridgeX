ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS sender_is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS traveler_is_verified boolean NOT NULL DEFAULT false;
UPDATE public.matches m SET sender_is_verified = (u.verification_status = 'approved') FROM public.users u WHERE m.sender_id = u.id;
UPDATE public.matches m SET traveler_is_verified = (u.verification_status = 'approved') FROM public.users u WHERE m.traveler_id = u.id;

CREATE OR REPLACE FUNCTION public.bridgex_snapshot_match_names()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT full_name, verification_status = 'approved' INTO NEW.sender_name, NEW.sender_is_verified FROM public.users WHERE id = NEW.sender_id;
  SELECT full_name, verification_status = 'approved' INTO NEW.traveler_name, NEW.traveler_is_verified FROM public.users WHERE id = NEW.traveler_id;
  NEW.sender_last_read_at := COALESCE(NEW.sender_last_read_at, now());
  NEW.traveler_last_read_at := COALESCE(NEW.traveler_last_read_at, now());
  RETURN NEW;
END;
$$;
