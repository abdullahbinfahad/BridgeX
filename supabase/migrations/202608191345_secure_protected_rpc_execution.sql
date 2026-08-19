REVOKE ALL ON FUNCTION public.accept_bridgex_response(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_bridgex_support_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_bridgex_contact_reply(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.accept_bridgex_response(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_bridgex_support_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_bridgex_contact_reply(uuid, text) TO authenticated;
