CREATE OR REPLACE FUNCTION public.dispatch_bridgex_expo_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  token_row record;
BEGIN
  FOR token_row IN
    SELECT expo_push_token
    FROM public.device_push_tokens
    WHERE user_id = NEW.user_id AND active = true AND platform = 'android'
  LOOP
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := jsonb_build_object(
        'to', token_row.expo_push_token,
        'title', NEW.title,
        'body', NEW.body,
        'data', jsonb_build_object('link', coalesce(NEW.link, '/notifications'), 'notificationId', NEW.id::text)
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bridgeX_dispatch_expo_push ON public.notifications;
CREATE TRIGGER bridgeX_dispatch_expo_push
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_bridgex_expo_push();
