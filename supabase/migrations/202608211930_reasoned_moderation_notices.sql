BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS restriction_reason text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS restriction_updated_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS restriction_updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS moderation_reason text;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS moderated_at timestamptz;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS moderation_reason text;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS moderated_at timestamptz;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.moderate_bridgex_member(
  p_user_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor public.users%ROWTYPE;
  v_target public.users%ROWTYPE;
  v_reason text := trim(coalesce(p_reason, ''));
BEGIN
  SELECT * INTO v_actor FROM public.users WHERE id = auth.uid();
  SELECT * INTO v_target FROM public.users WHERE id = p_user_id FOR UPDATE;

  IF v_actor.id IS NULL OR v_actor.role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only an administrator can change a member restriction.';
  END IF;
  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Member not found.';
  END IF;
  IF v_target.id = v_actor.id THEN
    RAISE EXCEPTION 'You cannot restrict or restore your own account.';
  END IF;
  IF lower(coalesce(v_target.email, '')) = 'abdullahbinfahad.abf@gmail.com' OR v_target.role = 'super_admin' THEN
    RAISE EXCEPTION 'The designated Super Admin account cannot be restricted through this control.';
  END IF;
  IF v_target.role = 'admin' AND v_actor.role <> 'super_admin' THEN
    RAISE EXCEPTION 'Only a Super Admin can restrict or restore another administrator.';
  END IF;

  IF p_action = 'restrict' THEN
    IF char_length(v_reason) NOT BETWEEN 5 AND 1200 THEN
      RAISE EXCEPTION 'Provide a clear member-facing restriction reason between 5 and 1200 characters.';
    END IF;
    UPDATE public.users
    SET suspended = true,
        restriction_reason = v_reason,
        restriction_updated_at = now(),
        restriction_updated_by = v_actor.id
    WHERE id = v_target.id;
    INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, related_id)
    VALUES (
      v_target.id,
      v_actor.id,
      'account_restricted',
      'Your BridgeX account is restricted',
      concat('Reason: ', v_reason, ' You may request a review through Contact support.'),
      '/contact?kind=moderation_appeal',
      v_target.id
    );
  ELSIF p_action = 'restore' THEN
    UPDATE public.users
    SET suspended = false,
        restriction_reason = NULL,
        restriction_updated_at = now(),
        restriction_updated_by = v_actor.id
    WHERE id = v_target.id;
    INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, related_id)
    VALUES (
      v_target.id,
      v_actor.id,
      'account_restored',
      'Your BridgeX account restriction was removed',
      'Your account can use available BridgeX features again. Please continue to follow the platform rules.',
      '/dashboard',
      v_target.id
    );
  ELSE
    RAISE EXCEPTION 'Unsupported member moderation action.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_bridgex_member(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_bridgex_member(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.moderate_bridgex_marketplace_post(
  p_kind text,
  p_post_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor public.users%ROWTYPE;
  v_owner_id uuid;
  v_title text;
  v_reason text := trim(coalesce(p_reason, ''));
  v_current_status text;
BEGIN
  SELECT * INTO v_actor FROM public.users WHERE id = auth.uid();
  IF v_actor.id IS NULL OR v_actor.role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only an administrator can moderate a marketplace post.';
  END IF;
  IF p_action NOT IN ('pause', 'restore') THEN
    RAISE EXCEPTION 'Unsupported marketplace moderation action.';
  END IF;
  IF p_action = 'pause' AND char_length(v_reason) NOT BETWEEN 5 AND 1200 THEN
    RAISE EXCEPTION 'Provide a clear member-facing post-moderation reason between 5 and 1200 characters.';
  END IF;

  IF p_kind = 'request' THEN
    SELECT user_id, title, status INTO v_owner_id, v_title, v_current_status FROM public.send_requests WHERE id = p_post_id FOR UPDATE;
    IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Send request not found.'; END IF;
    IF p_action = 'pause' THEN
      UPDATE public.send_requests SET status = 'closed', moderation_reason = v_reason, moderated_at = now(), moderated_by = v_actor.id, updated_at = now() WHERE id = p_post_id;
    ELSE
      IF v_current_status <> 'closed' THEN RAISE EXCEPTION 'Only an administrator-paused request can be restored.'; END IF;
      UPDATE public.send_requests SET status = 'open', moderation_reason = NULL, moderated_at = now(), moderated_by = v_actor.id, updated_at = now() WHERE id = p_post_id;
    END IF;
  ELSIF p_kind = 'listing' THEN
    SELECT user_id, transport_mode, status INTO v_owner_id, v_title, v_current_status FROM public.carry_listings WHERE id = p_post_id FOR UPDATE;
    IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Carry listing not found.'; END IF;
    IF p_action = 'pause' THEN
      UPDATE public.carry_listings SET status = 'paused', moderation_reason = v_reason, moderated_at = now(), moderated_by = v_actor.id, updated_at = now() WHERE id = p_post_id;
    ELSE
      IF v_current_status <> 'paused' THEN RAISE EXCEPTION 'Only an administrator-paused carry listing can be restored.'; END IF;
      UPDATE public.carry_listings SET status = 'open', moderation_reason = NULL, moderated_at = now(), moderated_by = v_actor.id, updated_at = now() WHERE id = p_post_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported marketplace post type.';
  END IF;

  IF p_action = 'pause' THEN
    INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, related_id)
    VALUES (v_owner_id, v_actor.id, 'post_paused', 'Your marketplace post was paused', concat('Reason: ', v_reason, ' You may request a review through Contact support.'), '/dashboard/posts', p_post_id);
  ELSE
    INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, related_id)
    VALUES (v_owner_id, v_actor.id, 'post_restored', 'Your marketplace post was restored', 'Your post is visible again in the marketplace, subject to normal availability and platform rules.', '/dashboard/posts', p_post_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_bridgex_marketplace_post(text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_bridgex_marketplace_post(text, uuid, text, text) TO authenticated;

COMMIT;
