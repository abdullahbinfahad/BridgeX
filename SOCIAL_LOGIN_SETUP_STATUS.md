# BridgeX Social Login Setup Status

## Public-source rule

OAuth client secrets, provider tokens, callback-session secrets, and private configuration must never be committed to this repository. Configure each provider through your own deployment environment and rotate a credential immediately if it was pasted into an issue, chat, terminal, or repository history.

## Provider requirements

Email/password, Google, Facebook, Apple, WeChat, and Alipay login each require separate provider approval, redirect URLs, and owner-controlled credentials. The public source contains integration points only; it does not include working third-party account credentials or a preconfigured provider account.

For any provider, add only your Supabase callback endpoint to the provider’s approved callback configuration. Add your public BridgeX host separately to the Supabase redirect allow-list. Keep provider App IDs and client secrets in your deployment environment, never in browser/mobile source.

## Before enabling a provider

1. Create the provider application under an organization account you control.
2. Configure the provider’s privacy policy, support email, and authorized origins.
3. Add your own Supabase callback endpoint and your own BridgeX redirect URL.
4. Store credentials in server-side/deployment secrets.
5. Test signup, sign-in, logout, reset, disabled-account, and redirect recovery flows.
6. Rotate any secret that was ever pasted into a public channel.
