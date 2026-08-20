ALTER TABLE public.bridgex_admin_section_reads
  DROP CONSTRAINT IF EXISTS bridgex_admin_section_reads_section_check;

ALTER TABLE public.bridgex_admin_section_reads
  ADD CONSTRAINT bridgex_admin_section_reads_section_check
  CHECK (section IN ('users', 'verification', 'payments', 'payouts', 'orders', 'reports', 'requests', 'listings'));
