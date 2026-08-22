# BridgeX Native Android Release 1.3.0

## Release summary

This release completes the next native Android parity pass for BridgeX. It improves visible form placeholders and entered-text contrast, uses the BridgeX surface color for Android system areas, adds startup/loading feedback, and ensures Android system back navigation returns through the in-app route history before exiting.

Marketplace cards and post details now show public member identity, verification state, ratings, fuller route and delivery context, multiple attached media, traveller inventory, and optional per-item carry budgets. Public member profiles show current public activity without exposing private contact, address, document, or payment data. The native offer and carry-interest workflows now collect more complete recipient, category, quantity, and route information.

## New native navigation

The app now uses a concise five-destination bottom navigation: Marketplace, Post, Workspace, Messages, and More. The More hub contains account entry points plus native About, How It Works, Safety, Contact, Downloads, Legal, Terms, and Privacy screens. Interaction feedback uses subtle haptics and short press-state motion rather than automatic sound effects.

## Carry-space budget extension

Carry listings can now keep numeric inventory for Mobile phones, Laptops, and Cameras while storing an optional preferred per-item budget separately. The same data field is implemented in the web carry-listing form. The schema addition is backward compatible: existing numeric inventory and live-capacity trigger behavior remain unchanged.

## Version and distribution

| Item | Value |
|---|---|
| Native version | 1.3.0 |
| Android version code | 14 |
| Package ID | `im.bridgex.marketplace` |
| EAS project | `459e7ae1-9dc7-4318-b642-814abe9ace20` |
| Build account | `abdullahbinfahadbridexs-team` |

Both signed artifacts were generated from commit `95746b8` and are ready for their respective distribution paths.

| Artifact | Build page / download |
|---|---|
| Android APK for direct distribution | https://expo.dev/artifacts/eas/N5fukcxoZHP8d2apA28UWulZSz94sBUqxyXNpYIX1pY.apk |
| Android App Bundle for Google Play Console | https://expo.dev/artifacts/eas/p6b5cEALF_XW6fqMKzUprrnqNfTRSAGjwhTUQrBdjc4.aab |

The public website footer now points to the 1.3.0 APK. The prior 1.2.0 artifact remains separate and will expire according to its original Expo retention date.
