-- Earlier Control Panel releases silently created first-read markers at the current time.
-- Reset only this operational read state so each administrator sees the existing actionable
-- queues once; opening a card immediately records the new per-section read time again.
UPDATE public.bridgex_admin_section_reads
SET last_read_at = TIMESTAMPTZ '1970-01-01 00:00:00+00'
WHERE section IN ('users', 'verification', 'payments', 'payouts', 'orders', 'reports', 'requests', 'listings');
