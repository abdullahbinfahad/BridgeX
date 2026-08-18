# BridgeX Social Login Setup Status

Email-password authentication is enabled through Supabase, and email confirmation is disabled so a newly registered email/password user can enter BridgeX directly after registration. Phone authentication remains disabled because SMS delivery requires an external SMS provider and usage billing.

## Google OAuth

A dedicated production Google OAuth client has been created in the LIORA Google Cloud project. Its authorized JavaScript origin is `https://bridgex.abdullahbinfahad.info`, and its authorized redirect URI is `https://cyvaajdozstfltulnghp.supabase.co/auth/v1/callback`. Google is enabled in Supabase Authentication → Sign In / Providers → Google, and the BridgeX Access page launches the OAuth flow with a return to `/onboarding`. OAuth client secrets are intentionally not stored in this repository. Because an OAuth secret was pasted into this chat during setup, it should be rotated in Google Cloud after sign-in verification.

Facebook remains disabled until a Meta application and its App ID/App Secret are available. Apple sign-in remains disabled because it requires Apple Developer Program enrollment and Apple credentials.

Facebook configuration requires a Meta application, the Supabase callback URL `https://cyvaajdozstfltulnghp.supabase.co/auth/v1/callback`, email permission, and a Facebook App ID and App Secret. See the official [Supabase Facebook Auth guide](https://supabase.com/docs/guides/auth/social-login/auth-facebook).

For all OAuth providers, only the provider’s configured callback should be the Supabase callback endpoint; BridgeX custom-domain URLs belong in Supabase’s redirect allow-list. OAuth provider credentials must never be placed in browser source code.
