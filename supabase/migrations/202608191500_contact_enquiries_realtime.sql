ALTER TABLE public.contact_enquiry_messages REPLICA IDENTITY FULL;
ALTER TABLE public.contact_enquiries REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_enquiry_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_enquiries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
