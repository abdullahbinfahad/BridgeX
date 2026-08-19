CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(trim(email)) BETWEEN 5 AND 254),
  subject text NOT NULL CHECK (char_length(trim(subject)) BETWEEN 3 AND 180),
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 20 AND 4000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS contact_enquiries_status_created_idx ON public.contact_enquiries(status, created_at DESC);
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_enquiries_public_submit ON public.contact_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY contact_enquiries_admin_read ON public.contact_enquiries FOR SELECT TO authenticated USING (public.is_bridgex_admin());
CREATE POLICY contact_enquiries_admin_update ON public.contact_enquiries FOR UPDATE TO authenticated USING (public.is_bridgex_admin()) WITH CHECK (public.is_bridgex_admin());
