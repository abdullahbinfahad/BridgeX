# BridgeX WeChat and Alipay Sign-in Requirements

## Current decision

BridgeX does **not** show WeChat or Alipay as sign-in buttons yet. The providers cannot be connected safely without an approved provider application, provider-issued credentials, approved callback configuration, and a secure server-side token exchange. Adding empty buttons would create a broken sign-in path and would not be a free, ready-to-use integration.

Email/password and Google remain the available sign-in methods. This is the correct current configuration.

## WeChat Website Login

WeChat’s official Website Login guide requires a registered Weixin Open Platform developer account, an approved website application, the AppID and AppSecret, and a callback domain matching the domain approved during review. The account registration process includes subject information confirmation and developer qualification certification.

When these are available, configure the approved BridgeX redirect URL, keep the AppSecret on the server only, exchange OAuth codes server-side, and add the provider to Supabase or a dedicated server-side OAuth callback. Do not place a WeChat AppSecret in browser code.

## Alipay Authorization Login

Alipay’s OAuth documentation requires an application identity assigned by Alipay, an `app_id`, and RSA/RSA2 request signing for the server-side authorization-code token exchange. Authorization depends on an approved callback URL and secure access-token handling.

When the owner has an approved Alipay application and signing material, implement the callback on a server route, retain the signing key as a secret, exchange the authorization code server-side, and create or link the BridgeX member account only after validating the provider response.

## Required owner inputs before implementation

| Provider | Required owner-provided items |
|---|---|
| WeChat | Approved Open Platform website app, AppID, AppSecret, approved callback domain and redirect URI |
| Alipay | Approved Alipay application, AppID, RSA/RSA2 signing material, Alipay public key, approved callback URL |

## Official references

1. [WeChat Website App Login Development Guide](https://developers.weixin.qq.com/doc/oplatform/en/Website_App/WeChat_Login/Wechat_Login)
2. [WeChat Open Platform Registration Guide](https://developers.weixin.qq.com/doc/oplatform/en/Third-party_Platforms/2.0/operation/open/create.html)
3. [Alipay OAuth Token API](https://global.alipay.com/docs/ac/solution_api/oauth_token)
4. [Alipay User Authorization Guide](https://global.alipay.com/docs/ac/common/obtain_uid)
