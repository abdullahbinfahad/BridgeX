ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'admin', 'super_admin'));

UPDATE public.users
SET role = 'super_admin', suspended = false
WHERE lower(email) = 'abdullahbinfahad.abf@gmail.com';

CREATE OR REPLACE FUNCTION public.is_bridgex_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND lower(email) = 'abdullahbinfahad.abf@gmail.com'
      AND suspended = false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_bridgex_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND suspended = false
  );
$$;

CREATE OR REPLACE FUNCTION public.protect_bridgex_administrator_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role IN ('admin', 'super_admin')
      AND OLD.id <> auth.uid()
      AND NOT public.is_bridgex_super_admin() THEN
      RAISE EXCEPTION 'Only the Super Admin can alter another administrator.';
    END IF;

    IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.suspended IS DISTINCT FROM OLD.suspended)
      AND NOT public.is_bridgex_super_admin() THEN
      RAISE EXCEPTION 'Only the Super Admin can change administrator roles or suspension state.';
    END IF;

    IF lower(OLD.email) = 'abdullahbinfahad.abf@gmail.com'
      AND (NEW.role <> 'super_admin' OR NEW.suspended = true) THEN
      RAISE EXCEPTION 'The designated Super Admin cannot be demoted or suspended.';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.role IN ('admin', 'super_admin') AND NOT public.is_bridgex_super_admin() THEN
      RAISE EXCEPTION 'Only the Super Admin can remove an administrator.';
    END IF;
    IF lower(OLD.email) = 'abdullahbinfahad.abf@gmail.com' THEN
      RAISE EXCEPTION 'The designated Super Admin cannot be removed.';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS bridgeX_protect_administrator_hierarchy ON public.users;
CREATE TRIGGER bridgeX_protect_administrator_hierarchy
BEFORE UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_bridgex_administrator_hierarchy();

CREATE OR REPLACE FUNCTION public.set_bridgex_member_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target_email text;
BEGIN
  IF NOT public.is_bridgex_super_admin() THEN
    RAISE EXCEPTION 'Only the Super Admin can manage administrator roles.';
  END IF;
  IF p_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'Only member or admin roles can be assigned.';
  END IF;
  SELECT email INTO target_email FROM public.users WHERE id = p_user_id;
  IF lower(coalesce(target_email, '')) = 'abdullahbinfahad.abf@gmail.com' THEN
    RAISE EXCEPTION 'The designated Super Admin role cannot be changed.';
  END IF;
  UPDATE public.users SET role = p_role WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_bridgex_member_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_bridgex_member_role(uuid, text) TO authenticated;
