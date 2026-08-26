# Open-Source Release Checklist

This checklist describes what can be made public safely and what must remain under operator control.

| Public source material | Never publish |
|---|---|
| Application code, migrations, generic configuration templates, tests, build instructions, and public documentation | `.env` files, service-role keys, OAuth secrets, Expo/Apple/Android signing credentials, payment-provider secrets, private object storage, user records, verification documents, payment proofs, raw messages, backups containing data, or production database exports |
| Desktop wrapper source | A signed Windows/macOS binary until the maintainer controls code signing and has tested the packaged artifact |
| Mobile Expo source and generic EAS profiles | A claim that an APK/IPA exists before a successful build has completed and been inspected |
| Generic self-hosting instructions | Another operator’s domain, account IDs, provider configuration, or internal incident history |

## Before changing visibility

1. Run a tracked-source and complete-history credential scan.
2. Remove or generalize owner-specific operational notes.
3. Confirm `.gitignore` excludes environment files, signing material, dependencies, build folders, and private artifacts.
4. Validate web and native tests without relying on local production credentials.
5. Publish the source commit before changing repository visibility.
6. Set GitHub metadata, topics, and community health files.
7. Rotate any credential that may ever have appeared in a public channel or past Git history.

## After release

Treat public issues as public records. Never request a user’s password, passport, ID card, exact address, payment screenshot, or raw message history in an issue or pull request. Use responsible disclosure for authorization, authentication, storage, payment, or data-exposure concerns.
