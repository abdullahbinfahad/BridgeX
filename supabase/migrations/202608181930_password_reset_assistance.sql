CREATE TABLE IF NOT EXISTS public.password_reset_assistance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administrator_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  member_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_assistance_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.request_bridgex_password_reset_assistance(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_member public.users%ROWTYPE;
BEGIN
  IF NOT public.is_bridgex_super_admin() THEN RAISE EXCEPTION 'Only the Super Admin can request password-reset assistance.'; END IF;
  SELECT * INTO v_member FROM public.users WHERE id = p_member_id;
  IF v_member.id IS NULL OR COALESCE(trim(v_member.email), '') = '' THEN RAISE EXCEPTION 'This member has no email address for a secure reset link.'; END IF;
  INSERT INTO public.password_reset_assistance_logs (administrator_id, member_id, member_email)
  VALUES (auth.uid(), p_member_id, v_member.email);
END;
$$;

DROP POLICY IF EXISTS password_reset_logs_super_admin_read ON public.password_reset_assistance_logs;
CREATE POLICY password_reset_logs_super_admin_read ON public.password_reset_assistance_logs
  FOR SELECT TO authenticated USING (public.is_bridgex_super_admin());

GRANT EXECUTE ON FUNCTION public.request_bridgex_password_reset_assistance(uuid) TO authenticated;
