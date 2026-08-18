# Android Push Notification Integration Reference

BridgeX uses an in-app notification centre immediately and registers a signed-in Android device for an Expo push token through the existing Expo project ID `131fe15d-e14d-4db6-80bc-e0a8eec89ac7`.

For production Android background delivery, Expo requires notification permission, an Expo push token, and Firebase Cloud Messaging (FCM) V1 credentials connected to the Expo project. The Android app configuration must reference the Firebase `google-services.json` file, while the FCM service-account JSON must be uploaded only to Expo/EAS credentials and must never be committed to Git.

Supabase supports event-triggered notification delivery through a `notifications` table and database webhooks/`pg_net`, which fire after an insert. `pg_net` uses asynchronous JSON HTTP POST calls through the `net.http_post` function and is suitable for a post-insert trigger.

## Official references

- [Expo push notification setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Expo FCM V1 credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Supabase push notification example](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Supabase database webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)
