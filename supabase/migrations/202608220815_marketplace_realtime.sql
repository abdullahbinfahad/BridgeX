ALTER TABLE public.send_requests REPLICA IDENTITY FULL;
ALTER TABLE public.carry_listings REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.send_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.carry_listings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
