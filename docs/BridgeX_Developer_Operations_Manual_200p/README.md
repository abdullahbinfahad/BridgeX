# BridgeX Developer Operations Manual — Build Source

This directory contains the reproducible source for the **200-page visual BridgeX Developer Operations Manual**. The manual documents the current web application, independent native mobile application, Supabase data/security controls, platform operations, release engineering, scaling, migration, and incident response.

## Build

1. Run `python3 generate_manual.py` to create `main.typ` and the 200 generated page visuals under `assets/`.
2. Compile `main.typ` with Typst using the companion report theme.
3. Verify the resulting PDF’s page count, text, fonts, and image coverage.

Generated images, review renders, diagnostic logs, and the final PDF are intentionally not tracked because the source generator reproduces them and the approved PDF is retained in the secure handover Drive folder.

> The manual is a technical handover. It distinguishes implemented work, active work, and roadmap items; it must not be used to claim that every listed future feature is already in production.
