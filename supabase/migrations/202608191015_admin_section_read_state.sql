CREATE TABLE IF NOT EXISTS public.bridgex_admin_section_reads (
  admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('users', 'verification', 'orders', 'reports', 'requests', 'listings')),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_id, section)
);

ALTER TABLE public.bridgex_admin_section_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bridgex_admin_section_reads_select_own ON public.bridgex_admin_section_reads;
CREATE POLICY bridgex_admin_section_reads_select_own
ON public.bridgex_admin_section_reads
FOR SELECT TO authenticated
USING (admin_id = auth.uid() AND public.is_bridgex_admin());

DROP POLICY IF EXISTS bridgex_admin_section_reads_insert_own ON public.bridgex_admin_section_reads;
CREATE POLICY bridgex_admin_section_reads_insert_own
ON public.bridgex_admin_section_reads
FOR INSERT TO authenticated
WITH CHECK (admin_id = auth.uid() AND public.is_bridgex_admin());

DROP POLICY IF EXISTS bridgex_admin_section_reads_update_own ON public.bridgex_admin_section_reads;
CREATE POLICY bridgex_admin_section_reads_update_own
ON public.bridgex_admin_section_reads
FOR UPDATE TO authenticated
USING (admin_id = auth.uid() AND public.is_bridgex_admin())
WITH CHECK (admin_id = auth.uid() AND public.is_bridgex_admin());
