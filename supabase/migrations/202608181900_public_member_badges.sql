CREATE OR REPLACE VIEW public.bridgex_member_badges
WITH (security_invoker = false)
AS
SELECT id, COALESCE(NULLIF(trim(full_name), ''), 'BridgeX member') AS display_name, COALESCE(is_verified, false) AS is_verified
FROM public.users;

GRANT SELECT ON public.bridgex_member_badges TO anon, authenticated;
