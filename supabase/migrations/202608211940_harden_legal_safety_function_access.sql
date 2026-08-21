BEGIN;

ALTER FUNCTION public.enforce_bridgex_terms_acknowledgement() SET search_path = public;
ALTER FUNCTION public.enforce_bridgex_item_declaration() SET search_path = public;
ALTER FUNCTION public.refuse_bridgex_handoff(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.moderate_bridgex_member(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.moderate_bridgex_marketplace_post(text, uuid, text, text) SET search_path = public;

REVOKE ALL ON FUNCTION public.refuse_bridgex_handoff(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.moderate_bridgex_member(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.moderate_bridgex_marketplace_post(text, uuid, text, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.refuse_bridgex_handoff(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_bridgex_member(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_bridgex_marketplace_post(text, uuid, text, text) TO authenticated;

COMMIT;
